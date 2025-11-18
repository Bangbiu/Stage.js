import COLORS from '../data/Colors.json' with { type: 'json' }
import { SObject } from "../utils/SObject.js";
import { clamp, range } from "../math/SMath.js";

declare const Hex8Brand: unique symbol;

type HexDigit =
    | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
    | "a" | "b" | "c" | "d" | "e" | "f"
    | "A" | "B" | "C" | "D" | "E" | "F";

type ByteHex = `${HexDigit}${HexDigit}`;

type Byte4 = Uint8Array & { readonly length: 4 };
type HexColor8 = `#${string}` & { readonly [Hex8Brand]: true };

type Colorizable = Color | string | number | Array<number>;

function asHexColor8(color: string): HexColor8 {
    if (!/^#[0-9a-fA-F]{8}$/.test(color)) {
        throw new Error(`Invalid HexColor8: ${color}`);
    }
    return color as HexColor8;
}

function byteToHex(v: number): ByteHex {
    return v.toString(16).padStart(2, "0").toUpperCase() as ByteHex;
}

export default class Color extends SObject {
    public value: Byte4;
    public code: HexColor8;
    constructor(r: number = 0, _g: number = r, _b: number = r, _a: number = 255) {
        super();
        this.value = new Uint8Array(4) as Byte4;
        this.code = "#FFFFFFFF" as HexColor8;
        for (const index of range(Math.min(arguments.length, 4))) 
            this.value[index] = Color.normalize255(arguments[0]);
        this.updateColorCode();
    }

    get r(): number {
        return this.value[0];
    }

    set r(value: number) {
        this.value[0] = Color.normalize255(value);
        this.updateColorCode();
    }

    get g(): number {
        return this.value[1];
    }

    set g(value: number) {
        this.value[1] = Color.normalize255(value)
        this.updateColorCode();
    }

    get b(): number {
        return this.value[2];
    }

    set b(value: number) {
        this.value[2] = Color.normalize255(value)
        this.updateColorCode();
    }

    get a(): number {
        return this.value[3];
    }

    set a(value: number) {
        this.value[3] = Color.normalize255(value)
        this.updateColorCode();
    }

    get arr(): ColorTuple {
        return [this.r, this.g, this.b, this.a];
    }

    copy(source: Color): this;
    copy(source: Partial<this>): this;
    copy(source: any): this {
        return this.updateValues(source);
    }

    clone(): this {
        return new Color(...this.value) as this;
    }

    set(val1: Colorizable): this;
    set(val1: any, val2: number = val1, val3: number = val1, val4: number = 255): this {
        return this.copy(Color.of(val1, val2, val3, val4));
    }

    add(other: Colorizable): this
    add(other: Partial<this>): this
    add(other: any): this {
        if (other instanceof Color) {
            for (const index of range(4)) {
                this.value[index] = Color.normalize255(this.value[index] + other.value[index]);
            }
        } else {
            this.add(Color.of(other));
        }
        return this.updateColorCode();
    }

    updateColorCode(): this {
        const [r, g, b, a] = this.value;
        this.code =
            ("#" +
            byteToHex(r) +
            byteToHex(g) +
            byteToHex(b) +
            byteToHex(a)) as HexColor8;
        return this;
    }

    static decompose(text: string): Color {
        if (text.startsWith("#")) {
            return new Color(
                parseInt(text.slice(1,3), 16),
                parseInt(text.slice(3,5), 16),
                parseInt(text.slice(5,7), 16),
                text.length == 9 ? parseInt(text.slice(7,9), 16) : 255,
            )
        } else if (text in COLORS) {
            return new Color(...COLORS[text as keyof typeof COLORS]);
        } else {
            return new Color();
        }
    }

    static of(val1: Colorizable): Color;
    static of(val1: number, val2: number, val3: number, val4: number): Color;
    static of(val1: any, val2: number = val1, val3: number = val1, val4: number = 255): Color {
        if (val1 instanceof Color) return val1;
        if (typeof val1 == "number")
            return new Color(val1, val2, val3, val4);
        else if (typeof val1 == "string")
            return Color.decompose(val1);
        else if (val1 instanceof Array) {
            return new Color(...val1);
        }
        throw new Error("Create Color with Invalid Value");
    }

    static normalize255(value: number) {
        const clipped = this.CLIP(value);
        return clipped < 1 && clipped > 0 ? clipped * 255 : clipped;
    }

    static clamp(value: number) {
        return clamp(value, 255);
    }
    
    static CLIP: ClipFunction = this.clamp;

}

export {
    asHexColor8,
    byteToHex,
    
    Color
}

export type {
    Byte4,
    ByteHex,
    Hex8Brand,
    HexDigit,
    HexColor8,
    Colorizable
}