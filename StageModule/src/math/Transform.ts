import { ASN_DEF, DATA_CLONE } from "../core/StageCore.js";
import { SObject } from "../utils/SObject.js";
import Rotation2D from "./Rotation2D.js";
import { Vector2D } from "./Vector2D.js";

type Transfizable = TransfromInit | Transform;

interface TransfromInit {
    trans?: Vector2D,
    scale?: Vector2D,
    rot?: Rotation2D
}

export default class Transform extends SObject {
    private trans!: Vector2D;
    private scale!: Vector2D;
    private rot!: Rotation2D;

    private _matrix: DOMMatrix | null = null;
    private _dirty = true;

    constructor( parameters: Transfizable = {} , assign: DataAssignType = ASN_DEF) {
        super();
        if (parameters instanceof Transform) {
            this.assign("trans", parameters.trans, assign);
            this.assign("scale", parameters.scale, assign);
            this.assign("rot", parameters.rot, assign);
        } else {
            const def = Transform.DEF_PROP;
            this.assign("trans", parameters.trans ?? def.trans, assign);
            this.assign("scale", parameters.scale ?? def.scale, assign);
            this.assign("rot", parameters.rot ?? def.rot, assign);
        }
        
    }

    copy(other: Partial<this>): this {
        super.copy(other);
        return this;
    }

    clone(): this {
        return new Transform({
            trans: this.trans, 
            rot: this.rot, 
            scale: this.scale 
        }, DATA_CLONE) as this;
    }

    add(other: Transform): this;
    add(other: Partial<this>): this;
    add(other: any): this {
        this.trans.add(other.trans);
        this.rot.add(other.rot);
        this.scale.scale(other.scale);
        return this;
    }
    
    apply(vec: Vector2D): Vector2D {
        return vec.sub(this.trans).rotate(-this.rot.value).scale(this.scale);
    }

    restore(vec: Vector2D): Vector2D {
        return vec.scale(this.scale).rotate(this.rot.value).add(this.trans);
    }

    transform(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
        ctx.translate(this.trans.x, this.trans.y);
        ctx.rotate(this.rot.value);
        ctx.scale(this.scale.x, this.scale.y);
        return ctx;
    } 

    toString(): string {
        return `<${this.className}:<(${this.trans.value}),${this.rot.value},(${this.scale.value})>`;
    }

    static DEF_PROP: TransfromInit = {
        trans: new Vector2D(),
        rot: new Rotation2D(),
        scale: new Vector2D(1,1)
    }
}