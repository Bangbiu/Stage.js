import * as SMath from "../math/SMath.js";
import PATHS from '../data/Paths.json' with { type: 'json' }
import { Vector2D, Rect2D } from "../math/Vector2D.js";
import Rotation2D from "../math/Rotation2D.js";
import { SObject } from "../utils/SObject.js";
import Course from "./Course.js";

type Graphizable = string | Course | Graphics2D | Polygon;

interface PolygonPreset {
    readonly [propName: string]: Polygon;
}

interface PathPreset {
    readonly [propName: string]: string;
}


const POLY: PolygonPreset = {
    square: [[-50,-50],[50,-50],[50,50],[-50,50]],
    area : [[0,0],[100,0],[100,100],[0,100]],
    rect: [[0,0],[200,0],[200,100],[0,100]],
    bar: [[-100,-50],[100,-50],[100,50],[-100,50]],
    raster: [[0,0],[1,0],[1,1],[0,1]],
    trapezoid: [[-25,-50],[50,-50],[50,50],[-50,50]],
    bullet: [[0,-35],[20,20],[0,0],[-20,20]],
    missle: [[0,-90],[40,-55],[30,50],[40,105],[-40,105],[-30,50],[-40,-55]],
    heart: [[0,-35],[35,-70],[70,-30],[0,50],[-70,-30],[-35,-70]]
}



class Graphics2D extends SObject implements Renderable {
    public clipper?: Graphics2D;
    public value: Course;

    constructor(course: Course = new Course(), clipper?: Graphics2D) {
        super();
        this.value = course;
        this.clipper = clipper;
    }

    get bound() {
        return this.value.bound;
    }

    update(): this {
        return this;
    }


    add(other: Graphics2D): this;
    add(other: Partial<this>): this;
    add(other: any): this {
        if (!(other instanceof Graphics2D)) return this;
        this.value.add(other.value);
        if (this.clipper && other.clipper) 
            this.clipper.add(other.clipper);
        return this;
    }

    clone(): this {
        return new Graphics2D(this.value.clone(), 
            this.clipper ? this.clipper.clone() : undefined) as this;
    }

    copy(other: Partial<this>): this {
        if (!(other instanceof Graphics2D)) return this;
        this.value = other.value.clone();
        this.clipper = other.clipper ? other.clipper.clone() : undefined;
        return this;
    }

    scaledPath(scale: Vector2D): Path2D {
        return this.value.scaledPath(scale);
    }

    scaledClip(scale: Vector2D): Opt<Path2D> {
        return this.clipper?.scaledPath(scale);
    }

    renderBound(ctx: CanvasRenderingContext2D, scale: Vector2D = Graphics2D.DEF_SCALE, 
        stroke: boolean = Graphics2D.DEF_STROKE, fill: boolean=Graphics2D.DEF_FILL): void 
    {
        Graphics2D.drawPath(ctx, this.bound.getRectPath(), scale, stroke, fill);    
    }

    render(ctx: CanvasRenderingContext2D, scale: Vector2D = Graphics2D.DEF_SCALE, 
        stroke: boolean = Graphics2D.DEF_STROKE, fill: boolean = Graphics2D.DEF_FILL): this 
    {   
        ctx.save();
        
        if (this.clipper != undefined) {
            ctx.clip(this.scaledClip(scale)!);
        }
        Graphics2D.drawPath(ctx, this.value.path, scale, stroke, fill);
        
        ctx.restore();
        return this;
    }

    static drawPath(ctx: CanvasRenderingContext2D, path: Path2D, scale: Vector2D, stroke: boolean, fill: boolean) {
        const scaledpath = Course.scaledPath(path, scale);
        if (stroke) ctx.stroke(scaledpath);
        if (fill) ctx.fill(scaledpath);
    }

    static polyToPathString(pts: Polygon): string {
        let res = "M ";
        res += `${pts[0][0]},${pts[0][1]} `;
        for (let i = 1; i < pts.length; i++)
            res += `L ${pts[i][0]},${pts[i][1]} `;
        return res + "Z";
    }

    static endpointToCenterArgs(startpt: Vector2D, args: number[]) {

        const srx = args[0];
        const sry = args[1];
        const xAxisRotationDeg = args[2];
        const largeArcFlag = args[3];
        const sweepFlag = args[4];
    
        const x1 = startpt.x;
        const y1 = startpt.y;
        const x2 = args[5];
        const y2 = args[6];

        const xAxisRotation = Rotation2D.toRad(xAxisRotationDeg);

        const cosphi = Math.cos(xAxisRotation);
        const sinphi = Math.sin(xAxisRotation);

        const [x1p, y1p] = SMath.mat2DotVec2(
            [cosphi, sinphi, -sinphi, cosphi],
            [(x1 - x2) / 2, (y1 - y2) / 2]
        );

        const [rx, ry] = SMath.correctRadii(srx, sry, x1p, y1p);

        const sign = largeArcFlag !== sweepFlag ? 1 : -1;
        const n = rx**2 * ry**2 - rx**2 * y1p**2 - ry**2 * x1p**2;
        const d = rx**2 * y1p**2 + ry**2 * x1p**2;
        

        const [cxp, cyp] = SMath.vec2Scale(
            [(rx * y1p) / ry, (-ry * x1p) / rx],
            sign * Math.sqrt(Math.abs(n / d))
        );

        const [cx, cy] = SMath.vec2Add(
            SMath.mat2DotVec2([cosphi, -sinphi, sinphi, cosphi], [cxp, cyp]) as [any, any],
            [(x1 + x2) / 2, (y1 + y2) / 2]
        );

        const a: [number, number] = [(x1p - cxp) / rx, (y1p - cyp) / ry];
        const b: [number, number] = [(-x1p - cxp) / rx, (-y1p - cyp) / ry];
        const startAngle = SMath.vec2Angle([1, 0], a);
        const deltaAngle0 = SMath.vec2Angle(a, b) % (2 * Math.PI);

        const deltaAngle =
            !sweepFlag && deltaAngle0 > 0
            ? deltaAngle0 - 2 * Math.PI
            : sweepFlag && deltaAngle0 < 0
            ? deltaAngle0 + 2 * Math.PI
            : deltaAngle0;

        const endAngle = startAngle + deltaAngle;

        return {
            cx,
            cy,
            rx,
            ry,
            startAngle,
            endAngle,
            xAxisRotation,
            anticlockwise: deltaAngle < 0
        };
    }

    static of(path: Graphizable, clipper?: Graphizable): Graphics2D {
        if (path instanceof Graphics2D) return path;
        const resolvedClipper = clipper ? this.of(clipper) : undefined;
        if (typeof path === "string") {
            return new Graphics2D(Course.parse(path), resolvedClipper);
        } else if (path instanceof Course) {
            return new Graphics2D(path, resolvedClipper);
        } else if (path instanceof Array) {
            return new Graphics2D(Course.parse(this.polyToPathString(path)), resolvedClipper);
        }
        throw new Error("Create Graphics2D with Invalid Value");
    }

    static SAMPLING_RESOLUTION = 24;

    static DEF_FILL = true;
    static DEF_STROKE = true;
    static DEF_SCALE = new Vector2D(1,1);
}

class GraphicsText extends Graphics2D {
    text: string;
    #textBound: Rect2D;

    constructor(text: string) {
        super();
        this.text = text;
        this.#textBound = new Rect2D();
    }

    clone(): this {
        return new GraphicsText(this.text) as this;
    }

    render(ctx: CanvasRenderingContext2D, scale: Vector2D, stroke: boolean = Graphics2D.DEF_STROKE, fill: boolean = Graphics2D.DEF_FILL): this {
        ctx.save();
        ctx.scale(...scale.array);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle"
        if (stroke) ctx.strokeText(this.text,0,0);
        if (fill) ctx.fillText(this.text,0,0);
        ctx.restore();
        return this;
    }

    get bound() {
        return this.#textBound;
    }

    calcBound(ctx: CanvasRenderingContext2D): Rect2D {
        let mat = ctx.measureText(this.text);
        let width = mat.width;
        let height = (mat.actualBoundingBoxAscent + mat.actualBoundingBoxDescent);
        this.#textBound = new Rect2D(-width/2, -height/2, width, height);
        return this.#textBound;
    }
}

export {
    POLY,
    PATHS,
    Graphics2D,
    GraphicsText,
}