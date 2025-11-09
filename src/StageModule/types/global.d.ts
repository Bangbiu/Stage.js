declare const APP_VERSION: string;

type Opt<T> = T | undefined;
// Function
type BiFunction<T1, T2, R> = (arg1: T1, arg2: T2) => R;
type UnaryFunction<T, R> = (input: T) => R;
type FnParams<T> = T extends (...args: infer A) => any ? A : never;
type FnReturn<T> = T extends (...args: any[]) => infer R ? R : undefined;
type AppendOptional<T extends any[], E> = [...T, E?];
// Array
type ElementType<T> = T extends (infer U)[] ? U : never;
// Class
type ClassType<T> = new (...args: unknown[]) => T;
type Constructor<T> = new (...args: unknown[]) => T;

// Prop
type IsObject<T> =
    T extends Primitive ? false :
    T extends Function ? false :
    T extends object ? true : false;

type NotPlainObj =
    Primitive
    | Array
    | Function
    | Date
    | RegExp
    | Map
    | Set
    | WeakMap
    | WeakSet;


// arrays/tuples should use numeric indexes only, not "length"/methods
type IndexKey<T> = T extends readonly any[] ? number | keyof T : keyof T;

type KeyPath<T extends Object> = string | KeyArrayPath<T>

/** Paths that may stop at any depth (prefixes allowed). */
type KeyArrayPath<T extends Object> =
    IsObject<T> extends true
        ? [] | { [K in IndexKey<T>]: [K, ...KeyPath<T[K]>] }[IndexKey<T>]
        : [];

/** Paths that must end on a non-object leaf. */
type LeafKeyPath<T> =
    IsObject<T> extends true
        ? { [K in IndexKey<T>]: [K, ...LeafKeyPath<T[K]>] }[IndexKey<T>]
        : [];

/** Value at the end of a path P inside T. */
type PathValue<T, P = KeyArrayPath<T>> =
    P extends [] ? T
    : P extends [infer K, ...infer R]
        ? K extends keyof T
        ? PathValue<T[K], R>
        : never
        : never;

type Widen<T> =
    T extends string ? string :
    T extends number ? number :
    T extends boolean ? boolean :
    T; // add others if needed

declare type PassiveEventType = "tick" | "resize";
declare type MouseEventType =  "mousedown"|"mouseup"|"mousemove"|"mouseenter"|"mouseleave"|"wheel";
declare type KeyBoardEventType = "keydown"|"keypress"|"keyup";

declare type StageIntEventType = PassiveEventType | MouseEventType | KeyBoardEventType;

declare type InteractiveState = "idle"|"hover"|"pressed";
declare type JSDataType = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function"
declare type Primitive = string | number | boolean | bigint | symbol | null | undefined;
declare type Addable = string | number | bigint;

declare type ClipFunction = (value: number, ...argArray: any[]) => number;

declare type HorizontalPosition = "left"|"centerH"|"right";
declare type VerticalPosition = "top"|"centerV"|"bottom";
declare type PivotSetting = [HorizontalPosition,VerticalPosition] | "center";

declare type AnimationType = "derive"|"toggle";

declare type Getter<T> = () => T;
declare type Caller<T> = T extends (...args: any[]) => infer R ? 
                            Getter<R> : undefined;
declare type Setter<T> = (v: T) => this;

declare type ColorText = keyof typeof COLORS;
declare type ColorTuple = [number, number, number, number];

declare type DataAssignType = "identical"|"clone"|"uninit";

declare type Rotationizable = Rotation2D | number | string;
declare type Vectorizable =  Vector2D | [number,number] | string | number;
declare type Rectizable =  Rect2D | Array<number> | string | number;
declare type Colorizable = Color | string | number | Array<number>;
declare type Graphizable = string | Graphics2D | Polygon;
declare type Numerizable = number | string;
declare type Transfizable = string | ContextTransfProperties | ContextTransf | Object2D;

declare type ResizeCallBack<T> = (this: T, parent: Vector2D, ev: UIEvent) => any;

declare type TickEvent<T> = TickCallBack<T> & TickEventProperties;
declare type TickCallBack<T> = (this: T, ev: TickEvent<T>) => any;

declare type MouseEventInfo = MouseEvent | WheelEvent;
declare type MouseCallBack<T extends StageInteractive> = (this: T, ev: ContextMouseEvent) => any;

declare type KBCallBack<T extends StageInteractive> = (this: T, ev: KeyboardEvent) => any;

declare type Polygon = [number, number][];

// Interfaces

declare interface Reproducable {
    clone(): this;
    copy(other: Partial<this>): this;
}
