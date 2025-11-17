export {};

declare global {
    declare type Not<T extends boolean> = T extends true ? false : true;
    declare type And<A extends boolean, B extends boolean> =
        A extends true ? (B extends true ? true : false) : false;
    declare type Or<A extends boolean, B extends boolean> =
        A extends true ? true : (B extends true ? true : false);

    declare type Widen<T> =
        T extends string ? string :
        T extends number ? number :
        T extends boolean ? boolean :
        T; 

    declare type Box<T> =
        T extends number ? Number :
        T extends string ? String :
        T extends boolean ? Boolean :
        T extends symbol ? Symbol :
        T extends bigint ? BigInt :
        T;
    declare type ResolvedAsObject<T> =
        T extends object? (IsCustomObject<T> extends true ? T : ValueWrapper<T>)
        : ValueWrapper<T>;

    // Checking
    declare type IsPrimitive<T> = T extends Primitive ? true : false;
    declare type IsNativeObject<T> =
        [T] extends [NativeObject] ? true : false;
    declare type IsPojo<T> =
        [T] extends [object]
            ? IsFn<T> extends true 
                ? false: IsNativeObject<T> extends true 
                    ? false
                    : T extends any[] ? false
                : true
            : false;
    declare type IsCustomClassInstance<T> =
        [T] extends [object]
            ? IsFn<T> extends true 
                ? false : IsNativeObject<T> extends true 
                    ? false
                    : T extends any[] ? false
                : true
            : false;

    declare type IsCustomObject<T extends object> =
        IsPojo<T> extends true 
            ? true: IsCustomClassInstance<T> extends true 
                ? true : false;

    declare type IsFn<T> = T extends (...args: any) => any ? true : false;
    declare type IsWrapper<T> =
    // avoid distribution over unions
    [T] extends [object]
        ? // no keys other than "value"
        [Exclude<keyof T, "value">] extends [never]
            ? // must include "value"
            ["value"] extends [keyof T]
                ? // and "value" must be required (not optional)
                ({} extends Pick<T, "value"> ? false : true)
                : false
            : false
        : false;

    declare type CustomObject<T> = IsCustomObject<T> extends true ? T : never;
    declare type NonCustomObject<T> = IsCustomObject<T> extends true ? never : T;
    // Intellisense
    declare type PartialNonUndefined<T> = {
        [K in keyof T]?: Exclude<T[K], undefined>;
    };
    declare type LoosePartialObject<T extends object> =
        Partial<RelaxValueOf<T>> | (Partial<RelaxValueOf<T>> & { [K in Exclude<PropertyKey, keyof T>]?: unknown });

    declare type LoosePartial<T> =
        IsCustomObject<T> extends true ? LoosePartialObject<T> : T;

    declare type BoxedWrapper<T> = ValueWrapper<Widen<T>> & Box<T>;
    declare type MonoObject<TKey, TVal> = { [K in TKey]: TVal };

    declare type ValueOfKeys<K extends JSTypeSet> = JSTypeMap[K[number]];
    declare type JSTypeSet = readonly (keyof JSTypeMap)[];
    declare type DefTypeSet = ["number", "boolean", "string"];
    declare type TypeOfSet<K extends JSTypeSet> = JSTypeMap[K[number]];
    declare type TypeOf<K extends JSDataType> = JSTypeMap[K];
    // Enum

    // Allowable depth levels (tweak as needed)
    declare type Depth = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

    // Simple decrement table for Depth
    declare type PrevDepth = {
    0: 0;
    1: 0;
    2: 1;
    3: 2;
    4: 3;
    5: 4;
    6: 5;
    7: 6;
    };

    declare type Dec<D extends Depth> = PrevDepth[D];

    declare type JSTypeMap = {
        string: string;
        number: number;
        bigint: bigint;
        boolean: boolean;
        symbol: symbol;
        undefined: undefined;
        object: object | null;
        function: (...args: any[]) => any;
    };

    declare type Opt<T> = T | undefined;
    declare type Voidable<T> = T | void;
    declare type JSDataType = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
    declare type Primitive = string | number | boolean | bigint | symbol | null | undefined;
    declare type DefTypeSet = number | boolean | string;

    declare type TypedArray =
        | Int8Array | Uint8Array | Uint8ClampedArray
        | Int16Array | Uint16Array
        | Int32Array | Uint32Array
        | Float32Array | Float64Array
        | BigInt64Array | BigUint64Array;

    declare type NativeObject =
        | Function
        | Date | RegExp | Promise<any> | Error
        | Array<any> | ReadonlyArray<any>
        | Map<any, any> | Set<any>
        | WeakMap<any, any> | WeakSet<any>
        | ArrayBuffer | DataView | TypedArray
        | URL | Blob | File | FormData;

    declare type Addable = string | number | bigint;
    declare type Subable = number;
    declare type Multable = number;

    // Function
    declare type AnyFunction = (...args: any[]) => any;
    declare type BiFunction<T1, T2, R> = (arg1: T1, arg2: T2) => R;
    declare type UnaryFunction<T, R> = (input: T) => R;
    declare type FnParams<T> = T extends (...args: infer A) => any ? A : never;
    declare type FnReturn<T> = T extends (...args: any[]) => infer R ? R : undefined;
    declare type AppendOptional<T extends any[], E> = [...T, E?];
    declare type RelaxValueOf<T> =
        T extends object
            ? { [K in keyof T]:
                K extends "valueOf"
                    ? T[K] extends (...args: infer A) => any
                        ? (...args: A) => any
                        : (...args: any[]) => any
                    : T[K]
            }
            : T;
    // Array
    declare type ElementType<T> = T extends (infer U)[] ? U : never;
    // Class
    declare type ClassType<T> = Function & { prototype: T };
    declare type Constructor<T> = new (...args: any[]) => T;

    declare interface ValueWrapper<T> {
        value: Widen<T>;
    }

    declare interface Reproducable {
        clone(): typeof this;
        copy(other: Partial<this>): this;
    }

    declare interface Attributive<
        TObject extends Record<PropertyKey, any>,
        TKey extends keyof TObject = keyof TObject
    > {
        readonly owner: TObject;
        readonly key: TKey;
    }

    // Enum
    declare type PassiveEventType = "tick" | "resize";
    declare type MouseEventType =  "mousedown"|"mouseup"|"mousemove"|"mouseenter"|"mouseleave"|"wheel";
    declare type KeyBoardEventType = "keydown"|"keypress"|"keyup";

    declare type StageIntEventType = PassiveEventType | MouseEventType | KeyBoardEventType;

    declare type InteractiveState = "idle"|"hover"|"pressed";

    declare type HorizontalPosition = "left"|"centerH"|"right";
    declare type VerticalPosition = "top"|"centerV"|"bottom";
    declare type PivotSetting = [HorizontalPosition,VerticalPosition] | "center";

    declare type AnimationType = "derive"|"toggle";

    declare type Getter<T> = () => T;
    declare type Caller<T> = T extends (...args: any[]) => infer R ? 
                                Getter<R> : undefined;
    declare type Setter<T> = (v: T) => this;

    declare type AttemptCallBack = <T extends object>(value: any, target: T, key: keyof T) => any;

    declare type Assertion<T> = (target: T) => boolean
    declare type ClipFunction = (value: number, ...argArray: any[]) => number;

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
}
