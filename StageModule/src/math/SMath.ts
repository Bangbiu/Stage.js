function* randomInt(cap1: number, cap2: number = 0, count: number = -1): Generator<[number, number], void, Voidable<boolean>> {
    const min = Math.min(cap1, cap2);
    const max = Math.max(cap1, cap2);
    let index = 0;
    while (true) {
        const ret = yield [Math.floor(Math.random() * (max - min + 1)) + min, index];
        if (ret === false) return;
        index++;
        if (index === count) return;
    }
}

function* range(cap1: number, cap2: number = 0, step: number = 1): Generator<number, void, void> {
    const min = Math.min(cap1, cap2);
    const max = Math.max(cap1, cap2);
    for (let num = min; num < max; num+= step){
        yield num;
    }
}

function* enumerate<T>(list: Array<T>): Generator<[T, number], void, void> {
    let index = 0
    for (const elem of list) {
        yield [elem, index];
        index++;
    }
}


function clamp(value: number, max: number, min: number = 0.0): number {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

function mirror(value: number, mid: number): number {
    value = value % (mid * 2);
    if (value <= mid) return value;
    else return 2 * mid - value;
}

function warp(value: number, wall: number): number {
    return (value % wall + wall) % wall;
}

function dwarp(value: number, wallMin: number, wallMax: number) {

}

function step(value: number,des: number): number {
    if (value >= des) return 1.0;
    else return 0.0;
}

function choose(option: number, ...argArray: any[]) {
    return argArray[option];
}

function arbittr(target: Object): any {
    const keys = Object.keys(target);
    return (target as any)[keys[Math.floor(Math.random() * keys.length)]];
}

function isInObject<T extends object>(target: T, elem: any): boolean {
    for (const key in target) {
        if (target[key] == elem) return true;
    }
    return false;
}

function correctRadii(signedRx: number, signedRy: number, x1p: number, y1p: number) {
    const prx = Math.abs(signedRx);
    const pry = Math.abs(signedRy);
  
    const A = x1p**2 / prx**2 + y1p**2 / pry**2;
  
    const rx = A > 1 ? Math.sqrt(A) * prx : prx;
    const ry = A > 1 ? Math.sqrt(A) * pry : pry;
  
    return [rx, ry];
}

function pow(n: number) {
    return Math.pow(n, 2);
}

function mat2DotVec2([m00, m01, m10, m11]: Tuple<number, 4>, [vx, vy]: Tuple<number, 2>) {
    return [m00 * vx + m01 * vy, m10 * vx + m11 * vy];
}

function vec2Scale([a0, a1]: Tuple<number, 2>, scalar: number) {
    return [a0 * scalar, a1 * scalar];
}

function vec2Dot([ux, uy]: Tuple<number, 2>, [vx, vy]: Tuple<number, 2>) {
    return ux * vx + uy * vy;
}

function vec2Mag([ux, uy]: Tuple<number, 2>) {
    return Math.sqrt(ux ** 2 + uy ** 2);
}

function vec2Add([ux, uy]: Tuple<number, 2>, [vx, vy]: Tuple<number, 2>) {
    return [ux + vx, uy + vy];
}

function vec2Angle(u: Tuple<number, 2>, v: Tuple<number, 2>) {
    const [ux, uy] = u;
    const [vx, vy] = v;
    const sign = ux * vy - uy * vx >= 0 ? 1 : -1;
    return sign * Math.acos(vec2Dot(u, v) / (vec2Mag(u) * vec2Mag(v)));
}


// Course
function cubicExtrema(p0: number, p1: number, p2: number, p3: number): number[] {
    // derivative is 3*(−p0 + 3p1 − 3p2 + p3)*t^2 + 6*(p0 − 2p1 + p2)*t + 3*(p1 − p0)
    const a = -p0 + 3*p1 - 3*p2 + p3;
    const b = 2*(p0 - 2*p1 + p2);
    const c = p1 - p0;

    const ts: number[] = [];

    const disc = b*b - 4*a*c;
    if (Math.abs(a) < 1e-6) {
        if (Math.abs(b) > 1e-6) {
            const t = -c / b;
            if (t > 0 && t < 1) ts.push(t);
        }
    } else if (disc >= 0) {
        const d = Math.sqrt(disc);
        const t1 = (-b + d) / (2*a);
        const t2 = (-b - d) / (2*a);
        if (t1 > 0 && t1 < 1) ts.push(t1);
        if (t2 > 0 && t2 < 1) ts.push(t2);
    }
    return ts;
}

function quadraticExtrema(p0: number, p1: number, p2: number): number[] {
    const t = (p0 - p1) / (p0 - 2*p1 + p2);
    return (t > 0 && t < 1) ? [t] : [];
}

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number) {
    const mt = 1 - t;
    return mt*mt*mt*p0 + 3*mt*mt*t*p1 + 3*mt*t*t*p2 + t*t*t*p3;
}

function quadraticAt(p0: number, p1: number, p2: number, t: number) {
    const mt = 1 - t;
    return mt*mt*p0 + 2*mt*t*p1 + t*t*p2;
}



export {
    randomInt,
    range,
    enumerate,

    clamp,
    mirror,
    warp,
    step,
    choose,
    arbittr,
    isInObject,
    correctRadii,
    pow,
    mat2DotVec2,
    vec2Scale,
    vec2Add,
    vec2Angle,

    // Course
    cubicExtrema,
    quadraticExtrema,
    cubicAt,
    quadraticAt
}