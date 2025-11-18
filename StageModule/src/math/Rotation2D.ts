import { isTypeIn } from "../core/StageCore.js";
import { SObject } from "../utils/SObject.js";

type Rotationizable = Rotation2D | Partial<Rotation2D> | number | string;

const PI: number = Math.PI;
const DPI: number = PI * 2;
const ROUND_OFF = 0.0001;

export default class Rotation2D extends SObject {
    value: number;
    constructor(rad: number = 0.0) {
        super();
        this.value = rad;
    }

    get rad(): number {
        return this.value;
    }

    set rad(val: number) {
        this.value = val;
    }
    
    get deg(): number {
        return Rotation2D.toDeg(this.rad);
    }

    set deg(degree: number) {
        this.rad = Rotation2D.toRad(degree);
    }

    set(other: Rotationizable): this {
        return this.copy(Rotation2D.of(other));
    }

    add(other: Rotationizable): this;
    add(other: any): this {
        if (other instanceof Rotation2D)
            return this.rotate(other.rad);
        else 
            return this.add(Rotation2D.of(other));
    }

    sub(other: Partial<this>): this;
    sub(other: Rotationizable): this;
    sub(other: any): this {
        if (other instanceof Rotation2D)
            return this.rotate(-other.rad);
        else 
            return this.sub(Rotation2D.of(other));
    }

    mult(other: Rotationizable): this;
    mult(_other: any): this {
        return this;
    }

    rotate(radian: number): this {
        this.rad += radian;
        return this;
    }

    rotateDeg(degree: number): this {
        this.deg += degree;
        return this;
    }

    rotate90(): this {
        return this.rotateDeg(90.0);
    }

    negate(): this {
        this.rad = -this.rad;
        return this
    }

    copy(source: Rotation2D): this;
    copy(source: Partial<this>): this;
    copy(source: any): this {
        return this.updateValues(source);
    }

    clone(): this {
        return new Rotation2D(this.rad) as this;
    }

    equals(other: Rotationizable): boolean {
        if (other instanceof Rotation2D)
            return Math.abs(this.rad - other.rad) < ROUND_OFF;
        else
            return this.equals(Rotation2D.of(other));
    }

    static toRad(degree: number): number {
        return PI * degree / 180;
    }
    
    static toDeg(radian: number): number {
        return 180 * radian / PI;
    }


    static of<T>(val: Rotationizable): Rotation2D;
    static of(val: any, ..._args: any[]): Rotation2D {
        if (val instanceof Rotation2D) return val;
        if (isTypeIn(val, ["number", "string"])) {
            return new Rotation2D(Number(val));
        } else if (val instanceof Rotation2D) {
            return new Rotation2D(val.value);
        } else if (typeof val === "object"){
            return new Rotation2D().copy(val);
        }
        throw new Error("Create Rotation with Invalid Value");
    }

    static operatable: JSTypeSet = ["number", "string", "object"];
}

export {
    PI,
    DPI,
    ROUND_OFF
}

export type {
    Rotationizable
}