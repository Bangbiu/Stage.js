import { isTypeIn } from "../core/StageCore.js";
import { SObject } from "../utils/SObject.js";

type Rotationizable = Rotation2D | number | string;

const PI: number = Math.PI;
const DPI: number = PI * 2;
const ROUND_OFF = 0.0001;

export default class Rotation2D extends SObject {
    value: number = 0.0;
    constructor(val: Rotationizable = 0) {
        super();
        if (val instanceof Rotation2D) 
            this.copy(val);
        else if (val == undefined)
            this.rad = 0.0;
        else {
            val = Number(val);
            if (Number(val) > DPI) 
                this.deg = val;
            else
                this.rad = val;
        } 
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

    set(other: Partial<this>): this
    set(other: Rotationizable): this
    set(other: any): this {
        if (other instanceof Rotation2D)
            this.rad = other.rad;
        else if (typeof other === "object")
            this.updateValues(other);
        else
            this.rad = Number(other);
        return this;
    }

    add(other: Partial<this>): this;
    add(other: Rotationizable): this;
    add(other: any): this {
        if (other instanceof Rotation2D)
            return this.rotate(other.rad);
        else if (typeof other === "object")
            super.add(other);
        else
            this.rotate(Number(other));
        return this;
    }

    sub(other: Partial<this>): this;
    sub(other: Rotationizable): this;
    sub(other: any): this {
        if (other instanceof Rotation2D)
            return this.rotate(-other.rad);
        else if (typeof other === "object")
            super.sub(other);
        else
            this.rotate(-other);
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
        return this.set(source);
    }

    clone<T extends Rotation2D = Rotation2D>(): T {
        return new Rotation2D(this) as T;
    }

    equals<T>(other: T): boolean {
        if (other instanceof Rotation2D)
            return Math.abs(this.rad - other.rad) < ROUND_OFF;
        else if (typeof other === "object") {
            return super.equals(other as any);
        } else if (isTypeIn(other, ["number", "string"])) {
            return this.rad == other || this.deg == other;
        }
        return false;
    }

    equivalent(other: Rotationizable): boolean {
        return this.equals(new Rotation2D(other));
    }

    static toRad(degree: number): number {
        return PI * degree / 180;
    }
    
    static toDeg(radian: number): number {
        return 180 * radian / PI;
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