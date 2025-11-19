import { 
    cubicAt, 
    cubicExtrema, 
    quadraticAt, 
    quadraticExtrema 
} from "../math/SMath.js";
import { Rect2D, Vector2D } from "../math/Vector2D.js";
/** 
 * COMMAND LETTER
 * 
 *      MOVETO:     M <x,y>
 *      LINETO:     L <x,y>
 *      HLINETO:    H <x>
 *      VLINETO:    V <y>
 *      ELLIPSE:    E <x,y>,<rx,ry>,<rot>,<startAng>,<endAng>,<cntClock>
 *      ARC:        A <rx,ry>,<x-rot>,<large-arc>,<sweep>,<x,y>
 *      QCURVE:     Q <cpx,cpy>,<endx,endy>
 *      CURVE:      C <cp1x,cp1y>,<cp2x,cp2y>,<endx,endy>
 *      CLOSEPATH:  Z
 * 
 */

enum PATHCMD {
    MOVETO  = "M",
    LINETO  = "L",
    HLINETO = "H",
    VLINETO = "V",
    CURVE   = "C", // cubic Bézier
    SCURVE  = "S", // smooth cubic Bézier
    QCURVE  = "Q", // quadratic Bézier
    TQCURVE = "T", // smooth quadratic Bézier
    ARC     = "A", // elliptical arc
    ELLIPSE = "E", // Custom ellipse command
    CLOSE   = "Z",
}

interface PathCommand {
    type: PATHCMD;
    args: number[];
}

export default class Course extends Array<PathCommand> implements Reproducable {
    private dirtyPath: boolean;
    private dirtyBound: boolean;
    private _path?: Path2D;
    private _bound?: Rect2D;

    constructor() {
        super();
        this.dirtyPath = false;
        this.dirtyBound = false;
    }

    get path(): Path2D {
        if (!this._path || this.dirtyPath) {
            this._path = this.getPath();
            this.dirtyPath = false;
        }
        return this._path;
    }

    get bound(): Rect2D {
        if (!this._bound || this.dirtyBound) {
            this._bound = this.getBounds();
            this.dirtyBound = false;
        }
        return this._bound;
    }

    setDirty(dirty: boolean = true): this {
        this.dirtyPath = dirty;
        this.dirtyBound = dirty;
        return this;
    }

    compute(): this {
        this._path = this.getPath();
        this._bound = this.getBounds();
        return this;
    }

    add(other: Course) {
        Array.prototype.push.apply(this, other);
        this.setDirty(true);
    }

    getPath(): Path2D {
        const path = new Path2D();

        // Track current point & subpath start
        let cx = 0;
        let cy = 0;
        let subStartX = 0;
        let subStartY = 0;

        // For smooth curves
        let lastCpx: number | null = null;
        let lastCpy: number | null = null;
        let lastQpx: number | null = null;
        let lastQpy: number | null = null;

        const resetC = () => { lastCpx = lastCpy = null; };
        const resetQ = () => { lastQpx = lastQpy = null; };

        const svgArcToCanvas = (
            x1: number, y1: number,
            rx: number, ry: number,
            phiDeg: number,
            largeArcFlag: number,
            sweepFlag: number,
            x2: number, y2: number
        ) => {
            // Based on SVG 2 impl notes – converts endpoint params to
            // center + angles, then uses Path2D.ellipse:contentReference[oaicite:0]{index=0}
            if (rx === 0 || ry === 0) {
                path.lineTo(x2, y2);
                return;
            }

            const phi = phiDeg * Math.PI / 180;
            const cosPhi = Math.cos(phi);
            const sinPhi = Math.sin(phi);

            // 1) Transform to midpoint coordinate system
            const dx = (x1 - x2) / 2;
            const dy = (y1 - y2) / 2;

            const x1p =  cosPhi * dx + sinPhi * dy;
            const y1p = -sinPhi * dx + cosPhi * dy;

            let rx2 = rx * rx;
            let ry2 = ry * ry;
            let x1p2 = x1p * x1p;
            let y1p2 = y1p * y1p;

            // 2) Correct radii if too small
            let lambda = (x1p2 / rx2) + (y1p2 / ry2);
            if (lambda > 1) {
                const s = Math.sqrt(lambda);
                rx *= s;
                ry *= s;
                rx2 = rx * rx;
                ry2 = ry * ry;
            }

            // 3) Compute center in prime system
            const sign = (largeArcFlag === sweepFlag) ? -1 : 1;
            const num = rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2;
            const den = rx2 * y1p2 + ry2 * x1p2;
            const factor = sign * Math.sqrt(Math.max(0, num / den));

            const cxp = factor * (rx * y1p / ry);
            const cyp = factor * (-ry * x1p / rx);

            // 4) Transform center back
            const cxArc = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
            const cyArc = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

            // 5) Compute start & end angles
            const vectorAngle = (ux: number, uy: number, vx: number, vy: number) => {
                const dot = ux * vx + uy * vy;
                const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
                let ang = Math.acos(Math.min(Math.max(dot / len, -1), 1));
                if (ux * vy - uy * vx < 0) ang = -ang;
                return ang;
            };

            const vx1 = ( x1p - cxp) / rx;
            const vy1 = ( y1p - cyp) / ry;
            const vx2 = (-x1p - cxp) / rx;
            const vy2 = (-y1p - cyp) / ry;

            let theta1 = vectorAngle(1, 0, vx1, vy1);
            let deltaTheta = vectorAngle(vx1, vy1, vx2, vy2);

            if (!sweepFlag && deltaTheta > 0) {
                deltaTheta -= 2 * Math.PI;
            } else if (sweepFlag && deltaTheta < 0) {
                deltaTheta += 2 * Math.PI;
            }

            const startAngle = theta1;
            const endAngle = theta1 + deltaTheta;
            const anticlockwise = sweepFlag ? false : true;

            path.ellipse(cxArc, cyArc, rx, ry, phi, startAngle, endAngle, anticlockwise);
        };

        for (const cmd of this) {
            const a = cmd.args;

            switch (cmd.type) {
                case PATHCMD.MOVETO: {
                    const [x, y] = a;
                    path.moveTo(x, y);
                    cx = x; cy = y;
                    subStartX = x; subStartY = y;
                    resetC(); resetQ();
                    break;
                }

                case PATHCMD.LINETO: {
                    const [x, y] = a;
                    path.lineTo(x, y);
                    cx = x; cy = y;
                    resetC(); resetQ();
                    break;
                }

                case PATHCMD.HLINETO: {
                    const [x] = a;
                    path.lineTo(x, cy);
                    cx = x;
                    resetC(); resetQ();
                    break;
                }

                case PATHCMD.VLINETO: {
                    const [y] = a;
                    path.lineTo(cx, y);
                    cy = y;
                    resetC(); resetQ();
                    break;
                }

                case PATHCMD.CURVE: {
                    const [x1, y1, x2, y2, x, y] = a;
                    path.bezierCurveTo(x1, y1, x2, y2, x, y);
                    cx = x; cy = y;
                    lastCpx = x2; lastCpy = y2;
                    resetQ();
                    break;
                }

                case PATHCMD.SCURVE: {
                    const [x2, y2, x, y] = a;
                    let x1: number;
                    let y1: number;
                    if (lastCpx != null && lastCpy != null) {
                        x1 = 2 * cx - lastCpx;
                        y1 = 2 * cy - lastCpy;
                    } else {
                        x1 = cx;
                        y1 = cy;
                    }
                    path.bezierCurveTo(x1, y1, x2, y2, x, y);
                    cx = x; cy = y;
                    lastCpx = x2; lastCpy = y2;
                    resetQ();
                    break;
                }

                case PATHCMD.QCURVE: {
                    const [x1, y1, x, y] = a;
                    path.quadraticCurveTo(x1, y1, x, y);
                    cx = x; cy = y;
                    lastQpx = x1; lastQpy = y1;
                    resetC();
                    break;
                }

                case PATHCMD.TQCURVE: {
                    const [x, y] = a;
                    let x1: number;
                    let y1: number;
                    if (lastQpx != null && lastQpy != null) {
                        x1 = 2 * cx - lastQpx;
                        y1 = 2 * cy - lastQpy;
                    } else {
                        x1 = cx;
                        y1 = cy;
                    }
                    path.quadraticCurveTo(x1, y1, x, y);
                    cx = x; cy = y;
                    lastQpx = x1; lastQpy = y1;
                    resetC();
                    break;
                }

                case PATHCMD.ARC: {
                    const [rx, ry, rot, largeArc, sweep, x, y] = a;
                    svgArcToCanvas(cx, cy, rx, ry, rot, largeArc, sweep, x, y);
                    cx = x; cy = y;
                    resetC(); resetQ();
                    break;
                }

                case PATHCMD.ELLIPSE: {
                    // convention: [rx, ry, cx, cy]
                    const [rx, ry, ecx, ecy] = a;
                    path.ellipse(ecx, ecy, rx, ry, 0, 0, 2 * Math.PI);
                    // current point unchanged (like SVG's full ellipse as subpath)
                    resetC(); resetQ();
                    break;
                }

                case PATHCMD.CLOSE: {
                    path.closePath();
                    cx = subStartX;
                    cy = subStartY;
                    resetC(); resetQ();
                    break;
                }
            }
        }

        return path;
    }

    getBounds(): Rect2D {
        if (this.length === 0) {
            return new Rect2D(0, 0, 0, 0);
        }

        let cx = 0;
        let cy = 0;
        let subStartX = 0;
        let subStartY = 0;

        let minX = +Infinity;
        let minY = +Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        const include = (x: number, y: number) => {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        };

        for (const cmd of this) {
            const a = cmd.args;

            switch (cmd.type) {
                case PATHCMD.MOVETO: {
                    const [x, y] = a;
                    cx = x; cy = y;
                    subStartX = x; subStartY = y;
                    include(x, y);
                    break;
                }

                case PATHCMD.LINETO: {
                    const [x, y] = a;
                    include(x, y);
                    cx = x; cy = y;
                    break;
                }

                case PATHCMD.HLINETO: {
                    const [x] = a;
                    include(x, cy);
                    cx = x;
                    break;
                }

                case PATHCMD.VLINETO: {
                    const [y] = a;
                    include(cx, y);
                    cy = y;
                    break;
                }

                case PATHCMD.QCURVE: {
                    const [x1, y1, x, y] = a;

                    // endpoints
                    include(cx, cy);
                    include(x, y);

                    // extrema in x
                    for (const t of quadraticExtrema(cx, x1, x)) {
                        const ex = quadraticAt(cx, x1, x, t);
                        const ey = quadraticAt(cy, y1, y, t);
                        include(ex, ey);
                    }

                    // extrema in y
                    for (const t of quadraticExtrema(cy, y1, y)) {
                        const ex = quadraticAt(cx, x1, x, t);
                        const ey = quadraticAt(cy, y1, y, t);
                        include(ex, ey);
                    }

                    cx = x; cy = y;
                    break;
                }

                case PATHCMD.CURVE: {
                    const [x1, y1, x2, y2, x, y] = a;

                    // endpoints
                    include(cx, cy);
                    include(x, y);

                    // extrema in x
                    for (const t of cubicExtrema(cx, x1, x2, x)) {
                        const ex = cubicAt(cx, x1, x2, x, t);
                        const ey = cubicAt(cy, y1, y2, y, t);
                        include(ex, ey);
                    }

                    // extrema in y
                    for (const t of cubicExtrema(cy, y1, y2, y)) {
                        const ex = cubicAt(cx, x1, x2, x, t);
                        const ey = cubicAt(cy, y1, y2, y, t);
                        include(ex, ey);
                    }

                    cx = x; cy = y;
                    break;
                }

                case PATHCMD.ARC: {
                    const [rx, ry, /*rot*/ , /*large*/, /*sweep*/, x, y] = a;

                    // include start and end
                    include(cx, cy);
                    include(x, y);

                    // crude ellipse-based expansion (not a tight bound but safe-ish)
                    include(cx - rx, cy - ry);
                    include(cx + rx, cy + ry);
                    include(x - rx, y - ry);
                    include(x + rx, y + ry);

                    cx = x; cy = y;
                    break;
                }

                case PATHCMD.ELLIPSE: {
                    // [rx, ry, ex, ey]
                    const [rx, ry, ex, ey] = a;
                    include(ex - rx, ey - ry);
                    include(ex + rx, ey + ry);
                    break;
                }

                case PATHCMD.CLOSE: {
                    include(subStartX, subStartY);
                    cx = subStartX;
                    cy = subStartY;
                    break;
                }
            }
        }

        if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
            return new Rect2D(0, 0, 0, 0);
        }

        return new Rect2D(
            minX,
            minY,
            maxX - minX,
            maxY - minY
        );
    }

    scaledPath(scale: Vector2D): Path2D {
        return Course.scaledPath(this.path, scale);
    }

    clone(): this {
        const course = new Course();
        for (const cmd of this) {
            course.push({ type: cmd.type, args: [...cmd.args] })
        }
        return course as this;
    }

    copy(other: Partial<this>): this {
        if (!(other instanceof Course)) return this;
        this.clear();
        for (const cmd of other) {
            this.push({ type: cmd.type, args: [...cmd.args] })
        }
        return this.setDirty(true);
    }

    clear(): this {
        this.length = 0;
        return this;
    }

    static scaledPath(path: Path2D, scale: Vector2D) {
        const res = new Path2D();
        res.addPath(path, { a: scale.x, d: scale.y });
        return res;
    }


    static parse(d: string): Course {
        const course: Course = new Course();
        // tokenize: commands or numbers (with optional exponent)
        const tokens = d
            .replace(/,/g, " ")
            .trim()
            .match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);

        if (!tokens) return course;

        let i = 0;
        let currentCmd: string | null = null;

        const isCommandToken = (t: string) => /^[a-zA-Z]$/.test(t);

        const readNumbers = (count: number): number[] => {
            const out: number[] = [];
            for (let k = 0; k < count; k++) {
                if (i >= tokens.length || isCommandToken(tokens[i])) {
                    throw new Error("Unexpected end of numeric arguments");
                }
                out.push(parseFloat(tokens[i++]));
            }
            return out;
        };

        while (i < tokens.length) {
            let token = tokens[i];

            // 1. Get command letter
            if (isCommandToken(token)) {
                currentCmd = token;
                i++;
            }

            if (!currentCmd) {
                throw new Error("Path data must start with a command letter");
            }

            const cmdUpper = currentCmd.toUpperCase();

            switch (cmdUpper) {
                // ===== MOVETO: first pair = M, subsequent pairs = L =====
                case PATHCMD.MOVETO: {
                    // first pair: moveto
                    const [x0, y0] = readNumbers(2);
                    course.push({ type: PATHCMD.MOVETO, args: [x0, y0] });

                    // subsequent pairs: implicit lineto
                    while (i < tokens.length && !isCommandToken(tokens[i])) {
                        if (i + 1 > tokens.length) break;
                        const [x, y] = readNumbers(2);
                        course.push({ type: PATHCMD.LINETO, args: [x, y] });
                    }
                    break;
                }

                // ===== LINETO (L) =====
                case PATHCMD.LINETO: {
                    while (i < tokens.length && !isCommandToken(tokens[i])) {
                        const [x, y] = readNumbers(2);
                        course.push({ type: PATHCMD.LINETO, args: [x, y] });
                    }
                    break;
                }

                // ===== HLINETO (H) =====
                case PATHCMD.HLINETO: {
                    while (i < tokens.length && !isCommandToken(tokens[i])) {
                        const [x] = readNumbers(1);
                        course.push({ type: PATHCMD.HLINETO, args: [x] });
                    }
                    break;
                }

                // ===== VLINETO (V) =====
                case PATHCMD.VLINETO: {
                    while (i < tokens.length && !isCommandToken(tokens[i])) {
                        const [y] = readNumbers(1);
                        course.push({ type: PATHCMD.VLINETO, args: [y] });
                    }
                    break;
                }

                // ===== CURVE (C): x1 y1 x2 y2 x y =====
                case PATHCMD.CURVE: {
                    while (i < tokens.length && !isCommandToken(tokens[i])) {
                        const nums = readNumbers(6);
                        course.push({ type: PATHCMD.CURVE, args: nums });
                    }
                    break;
                }

                // ===== SCURVE (S): x2 y2 x y =====
                case PATHCMD.SCURVE: {
                    while (i < tokens.length && !isCommandToken(tokens[i])) {
                        const nums = readNumbers(4);
                        course.push({ type: PATHCMD.SCURVE, args: nums });
                    }
                    break;
                }

                // ===== QCURVE (Q): x1 y1 x y =====
                case PATHCMD.QCURVE: {
                    while (i < tokens.length && !isCommandToken(tokens[i])) {
                        const nums = readNumbers(4);
                        course.push({ type: PATHCMD.QCURVE, args: nums });
                    }
                    break;
                }

                // ===== TQCURVE (T): x y =====
                case PATHCMD.TQCURVE: {
                    while (i < tokens.length && !isCommandToken(tokens[i])) {
                        const nums = readNumbers(2);
                        course.push({ type: PATHCMD.TQCURVE, args: nums });
                    }
                    break;
                }

                // ===== ARC (A): rx ry rot largeArcFlag sweepFlag x y =====
                case PATHCMD.ARC: {
                    while (i < tokens.length && !isCommandToken(tokens[i])) {
                        const nums = readNumbers(7);
                        course.push({ type: PATHCMD.ARC, args: nums });
                    }
                    break;
                }

                // ===== Custom ELLIPSE (E): rx ry cx cy (your convention) =====
                case PATHCMD.ELLIPSE: {
                    while (i < tokens.length && !isCommandToken(tokens[i])) {
                        const nums = readNumbers(4);
                        course.push({ type: PATHCMD.ELLIPSE, args: nums });
                    }
                    break;
                }

                // ===== CLOSE (Z) =====
                case PATHCMD.CLOSE: {
                    course.push({ type: PATHCMD.CLOSE, args: [] });
                    // Z has no parameters, we just move on.
                    break;
                }

                default:
                    throw new Error(`Unsupported path command: ${currentCmd}`);
            }
        }

        return course;
    }
}

export {
    PATHCMD
}

export type {
    PathCommand
}