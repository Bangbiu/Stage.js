import { SObject } from "../utils/SObject.js";
import { warp } from "./SMath.js";

type Vectorizable =  Vector2D | Partial<Vector2D> | [number,number] | string | number;
type Rectizable =  Vectorizable | Rect2D |  Partial<Rect2D> | Tuple<number, 4>;

class Vector2D extends SObject {
    public x: number;
    public y: number;

    constructor(v1: number = 0, v2: number = v1) {
        super();
        this.x = v1;
        this.y = v2;
    }

    scale(coef: number | Vector2D): this {
        if (coef instanceof Vector2D) {
            this.x = this.x * coef.x;
            this.y = this.y * coef.y;
        } else if (typeof coef === "number") {
            this.x = this.x * coef;
            this.y = this.y * coef;
        }
        return this;
    }

    scaleXY(coefX: number, coefY: number): this {
        this.x = this.x * coefX;
        this.y = this.y * coefY;
        return this;
    }

    divide(coef: number | Vector2D): this {
        if (coef instanceof Vector2D) {
            this.x = this.x / coef.x;
            this.y = this.y / coef.y;
        } else {
            this.x = this.x / coef;
            this.y = this.y / coef;
        }
        return this;
    }

    divideXY(coefX: number, coefY: number): this {
        this.x = this.x / coefX;
        this.y = this.y / coefY;
        return this;
    }

    negate(): this {
        return this.scale(-1);
    }

    clear(): this {
        this.x = 0.0;
        this.y = 0.0;
        return this;
    }
    
    interpolater(u: number = 0.5): Vector2D {
        return this.clone().scale(u);
    }

    add(other: Vectorizable): this;
    add(other: Partial<this>): this;
    add(other: any): this {
        if (other instanceof Vector2D) {
            this.x = this.x + other.x;
            this.y = this.y + other.y;
        } else {
            this.add(new Vector2D(other))
        }
        return this;
    }

    sub(other: Vectorizable): this;
    sub(other: Partial<this>): this;
    sub(other: any): this {
        if (other instanceof Vector2D) {
            this.x = this.x - other.x;
            this.y = this.y - other.y;
        } else {
            this.sub(Vector2D.of(other))
        }
        return this;
    }

    moveBy(x: number, y: number): this {
        this.x = this.x + x;
        this.y = this.y + y;
        return this;
    }

    copy<T extends Vector2D>(source: T): this;
    copy<T extends Vector2D>(source: Partial<T>): this;
    copy(source: any): this {
        return this.updateValues(source);
    }

    clone(): this {
        return new Vector2D(this.x, this.y) as this;
    }

    moveTo(x: number, y: number): this {
        this.x = x;
        this.y = y;
        return this;
    }

    warp(xMax: number | Vector2D, yMax?: number): this {
        if (xMax instanceof Vector2D) {
            this.x = warp(this.x, xMax.x);
            this.y = warp(this.y, xMax.y);
        } else {
            this.x = warp(this.x, xMax);
            if (yMax) this.y = warp(this.y, yMax);
        }
        return this;
    }
    
    set(val1: Vectorizable): this;
    set(val1: number, val2: number): this;
    set(val1: any, val2?: number): this {
        return this.copy(Vector2D.of(val1, val2));
    }

    normalize(): this {
        let len = this.length();
        this.x = this.x / len;
        this.y = this.y / len;
        return this;
    }

    floor(): this {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this;
    }

    ceil(): this {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this;
    }

    round(): this {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }

    rotate(theta: number): this {
        if (theta == 0) return this;
        this.x = this.x*Math.cos(theta) - this.y*Math.sin(theta);
        this.y = this.x*Math.sin(theta) + this.y*Math.cos(theta);
        return this;
    }

    length(): number {
        return Math.sqrt(this.sqrLen());
    }

    sqrLen(): number {
        return this.x**2 + this.y**2;
    }

    distTo(other: Vector2D): number {
        return this.to(other).length();
    }

    get array(): [number, number] {
        return [this.x, this.y];
    }

    to(other: Vector2D, u: number = 1): Vector2D {
        return this.clone().scale(-u).add(other);
    }

    from(other: Vector2D, u: number = 1): Vector2D {
        return other.clone().scale(-u).add(this);
    }

    isInRect(range: Rect2D) {
        return this.x >= range.left && this.x <= range.right 
            && this.y >= range.top && this.y <= range.bottom;
    }

    toString(): string {
        return `<${this.className}:(${this.x},${this.y})>`;
    }

    equals(other: Vectorizable): boolean {
        if (other instanceof Vector2D)
            return this.x == other.x && this.y == other.y;
        else
            return this.equals(Vector2D.of(other));
    }

    static interpolate(a: Vector2D, b: Vector2D, u: number = 0.5): Vector2D {
        return a.to(b,u).add(a);
    }

    static of<T extends Vector2D>(val1: Vectorizable): T;
    static of<T extends Vector2D>(val1: number, val2?: number): T;
    static of(val1: any, val2: number = val1): any {
        if (val1 instanceof Vector2D) return val1;
        if (typeof val1 === "number") {
            return new Vector2D(val1, val2);
        } else if (typeof val1 === "string") {
            const coord = val1.split(",").map(str => Number(str));
            return new Vector2D(coord[0], coord[1] ?? coord[0]);
        } else if (val1 instanceof Array) {
            return new Vector2D(val1[0] ?? 0, val1[1] ?? val1[0] ?? 0);
        } else if (typeof val1 === "object") {
            return new Vector2D().copy(val1);
        }
        throw new Error("Create Vector2D with Invalid Value");
    }
}

class Rect2D extends Vector2D {
    public width: number;
    public height: number;

    constructor(v1: number = 0, v2: number = 0, v3: number = 0, v4: number = 0) {
        super(v1, v2);
        this.width = v3;
        this.height = v4;
    }

    get left(): number {
        return this.x;
    }

    set left(val: number) {
        this.width += this.x - val;
        this.x = val;
    }

    get right(): number {
        return this.x + this.width;
    }

    set right(val: number) {
        this.width = val - this.x;
    }

    get top(): number {
        return this.y;
    }

    set top(val: number) {
        this.height += this.y - val;
        this.y = val;
    }

    get bottom(): number {
        return this.y + this.height;
    }

    set bottom(val: number) {
        this.height = val - this.y;
    }

    get centerH(): number {
        return this.left + this.width / 2 ;
    }

    get centerV(): number {
        return this.top + this.height / 2 ;
    }

    get center(): Vector2D {
        return new Vector2D(this.centerH,this.centerV);
    }

    get topLeft(): Vector2D {
        return new Vector2D(this.left, this.top);
    }

    get topRight(): Vector2D {
        return new Vector2D(this.right, this.top);
    }

    get bottomLeft(): Vector2D {
        return new Vector2D(this.left, this.bottom);
    }

    get bottomRight(): Vector2D {
        return new Vector2D(this.right, this.bottom);
    }

    get arr(): [number, number, number, number] {
        return [this.x, this.y, this.width, this.height];
    }

    get pos(): Vector2D {
        return new Vector2D(this.x, this.y);
    }

    get dimension(): Vector2D {
        return new Vector2D(this.width, this.height);
    }

    get vertices(): Tuple<Vector2D, 4> {
        return [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft];
    }

    getPivot(horiz: number | Vector2D = 0, verti: number = 0): Vector2D {
        if (horiz instanceof Vector2D) {
            return new Vector2D(this.width * horiz.x,this.height * horiz.y);
        } else {
            return new Vector2D(this.width * horiz,this.height * verti);
        }
    }

    scale(vec: Vector2D): this {
        this.x *=vec.x;
        this.y *=vec.y;
        this.width *=vec.x;
        this.height *=vec.y;
        return this;
    }

    copy(source: Rect2D): this;
    copy(source: Partial<this>): this;
    copy(source: any): this {
        return this.updateValues(source);
    }

    clone(): this {
        return new Rect2D(this.x, this.y, this.width, this.height) as this;
    }

    expand(pt: Vector2D): this {
        return this.expandXY(pt.x, pt.y);
    }

    expandXY(x: number, y: number): this {
        if (x < this.left) 
            this.left = x;
        else if (this.right < x) 
            this.right = x;
        
        if (y < this.top)
            this.top = y;
        else if (this.bottom < y)
            this.bottom = y;     
        return this;
    }

    set(val1: Rectizable): this;
    set(val1: number, val2?: number, val3?: number, val4?: number): this;
    set(val1: any, val2: number = 0, val3: number = 0, val4: number = 0): this {
        return this.copy(Rect2D.of(val1, val2, val3, val4));
    }

    add(other: Rectizable): this;
    add(other: Partial<this>): this;
    add(other: any): this {
        for (const vert of Rect2D.of(other).vertices) 
            this.expand(vert);
        return this;
    }

    getRectPath(): Path2D {
        const res = new Path2D();
        res.moveTo(this.left, this.top);
        res.lineTo(this.right, this.top);
        res.lineTo(this.right, this.bottom);
        res.lineTo(this.left, this.bottom);
        res.closePath();
        return res;
    }

    equals(other: Rectizable): boolean
    equals(other: Vector2D): boolean
    equals(other: any): boolean {
        if (other instanceof Rect2D)
            return other.x === this.x 
                && other.y === this.y
                && other.width === this.width 
                && other.height === this.height; 
        else if (other instanceof Vector2D) 
            return super.equals(other);
        else
            return this.equals(Rect2D.of(other));
    }

    toString(): string {
        return `<${this.className}:(${this.x},${this.y},${this.width},${this.height})>`;
    }

    isInRect(range: Rect2D): boolean {
        return this.left >= range.left && this.right <= range.right
                && this.top >= range.top && this.bottom <= range.bottom;
    }

    static of(val1: Rectizable): Rect2D;
    static of(val1: number, val2?: number, val3?: number, val4?: number): Rect2D;
    static of(val1: any, val2: number = 0, val3: number = 0, val4: number = 0): any {
        if (val1 instanceof Rect2D) return val1;
        if (typeof val1 == "number") {
            return new Rect2D(val1, val2, val3, val4);
        } else if (typeof val1 == "string") {
            return new Rect2D(...val1.split(",").map(str => Number(str)));
        } else if (val1 instanceof Array) {
            return new Rect2D(...val1);
        }  else if (typeof val1 === "object") {
            return new Rect2D().copy(val1);
        }
        throw new Error("Create Rect2D with Invalid Value");
    }
}

export {
    Vector2D,
    Rect2D
}

export type {
    Vectorizable,
    Rectizable
}