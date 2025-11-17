
declare global {
    type Not<T extends boolean> = T extends true ? false : true;
    type And<A extends boolean, B extends boolean> =
        A extends true ? (B extends true ? true : false) : false;
    type Or<A extends boolean, B extends boolean> =
        A extends true ? true : (B extends true ? true : false);

    type Widen<T> =
        T extends string ? string :
        T extends number ? number :
        T extends boolean ? boolean :
        T; 

    type Box<T> =
        T extends number ? Number :
        T extends string ? String :
        T extends boolean ? Boolean :
        T extends symbol ? Symbol :
        T extends bigint ? BigInt :
        T;
    type ResolvedAsObject<T> =
        T extends object? (IsCustomObject<T> extends true ? T : ValueWrapper<T>)
        : ValueWrapper<T>;

    // Checking
    type IsPrimitive<T> = T extends Primitive ? true : false;
    type IsNativeObject<T> =
        [T] extends [NativeObject] ? true : false;
    type IsPojo<T> =
        [T] extends [object]
            ? IsFn<T> extends true 
                ? false: IsNativeObject<T> extends true 
                    ? false
                    : T extends any[] ? false
                : true
            : false;
    type IsCustomClassInstance<T> =
        [T] extends [object]
            ? IsFn<T> extends true 
                ? false : IsNativeObject<T> extends true 
                    ? false
                    : T extends any[] ? false
                : true
            : false;

    type IsCustomObject<T> = 
        T extends object 
            ? IsPojo<T> extends true 
                ? true: IsCustomClassInstance<T> extends true 
            ? true : false 
        : false;

    type IsFn<T> = T extends (...args: any) => any ? true : false;
    type IsWrapper<T> =
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

    type CustomObject<T> = IsCustomObject<T> extends true ? T : never;
    type NonCustomObject<T> = IsCustomObject<T> extends true ? never : T;
    // Intellisense
    type PartialNonUndefined<T> = {
        [K in keyof T]?: Exclude<T[K], undefined>;
    };
    type LoosePartialObject<T> =
        Partial<RelaxValueOf<T>> | (Partial<RelaxValueOf<T>> & { [K in Exclude<PropertyKey, keyof T>]?: unknown });

    type LoosePartial<T> =
        IsCustomObject<T> extends true ? LoosePartialObject<T> : T;

    type BoxedWrapper<T> = ValueWrapper<Widen<T>> & Box<T>;
    type MonoObject<TKey extends PropertyKey, TVal> = { [K in TKey]: TVal };

    type ValueOfKeys<K extends JSTypeSet> = JSTypeMap[K[number]];
    type JSTypeSet = readonly (keyof JSTypeMap)[];
    type DefTypeSet = ["number", "boolean", "string"];
    type TypeOfSet<K extends JSTypeSet> = JSTypeMap[K[number]];
    type TypeOf<K extends JSDataType> = JSTypeMap[K];
    // Enum

    // Allowable depth levels (tweak as needed)
    type Depth = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

    // Simple decrement table for Depth
    type PrevDepth = {
    0: 0;
    1: 0;
    2: 1;
    3: 2;
    4: 3;
    5: 4;
    6: 5;
    7: 6;
    };

    type Dec<D extends Depth> = PrevDepth[D];

    type JSTypeMap = {
        string: string;
        number: number;
        bigint: bigint;
        boolean: boolean;
        symbol: symbol;
        undefined: undefined;
        object: object | null;
        function: (...args: any[]) => any;
    };

    type Opt<T> = T | undefined;
    type Voidable<T> = T | void;
    type JSDataType = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
    type Primitive = string | number | boolean | bigint | symbol | null | undefined;
    type DefType = number | boolean | string;

    type TypedArray =
        | Int8Array | Uint8Array | Uint8ClampedArray
        | Int16Array | Uint16Array
        | Int32Array | Uint32Array
        | Float32Array | Float64Array
        | BigInt64Array | BigUint64Array;

    type NativeObject =
        | Function
        | Date | RegExp | Promise<any> | Error
        | Array<any> | ReadonlyArray<any>
        | Map<any, any> | Set<any>
        | WeakMap<any, any> | WeakSet<any>
        | ArrayBuffer | DataView | TypedArray
        | URL | Blob | File | FormData;

    type Addable = string | number | bigint;
    type Subable = number;
    type Multable = number;

    // Function
    type AnyFunction = (...args: any[]) => any;
    type BiFunction<T1, T2, R> = (arg1: T1, arg2: T2) => R;
    type UnaryFunction<T, R> = (input: T) => R;
    type FnParams<T> = T extends (...args: infer A) => any ? A : never;
    type FnReturn<T> = T extends (...args: any[]) => infer R ? R : undefined;
    type AppendOptional<T extends any[], E> = [...T, E?];
    type RelaxValueOf<T> =
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
    type ElementType<T> = T extends (infer U)[] ? U : never;
    // Class
    type ClassType<T> = Function & { prototype: T };
    type Constructor<T> = new (...args: any[]) => T;

    interface ValueWrapper<T> {
        value: Widen<T>;
    }

    interface Reproducable {
        clone(): this;
        copy(other: Partial<this>): this;
    }

    interface Attributive<
        TObject extends Record<PropertyKey, any>,
        TKey extends keyof TObject = keyof TObject
    > {
        readonly owner: TObject;
        readonly key: TKey;
    }

    // Enum
    type PassiveEventType = "tick" | "resize";
    type MouseEventType =  "mousedown"|"mouseup"|"mousemove"|"mouseenter"|"mouseleave"|"wheel";
    type KeyBoardEventType = "keydown"|"keypress"|"keyup";

    type StageIntEventType = PassiveEventType | MouseEventType | KeyBoardEventType;

    type InteractiveState = "idle"|"hover"|"pressed";

    type HorizontalPosition = "left"|"centerH"|"right";
    type VerticalPosition = "top"|"centerV"|"bottom";
    type PivotSetting = [HorizontalPosition,VerticalPosition] | "center";

    type AnimationType = "derive"|"toggle";

    type Getter<T> = () => T;
    type Caller<T> = T extends (...args: any[]) => infer R ? 
                                Getter<R> : undefined;
    type Setter<T, R> = (v: T) => R;

    type AttemptCallBack = <T extends object>(value: any, target: T, key: keyof T) => any;

    type Assertion<T> = (target: T) => boolean
    type ClipFunction = (value: number, ...argArray: any[]) => number;

    // type ColorText = keyof typeof COLORS;
    type ColorTuple = [number, number, number, number];

    type DataAssignType = "identical"|"clone"|"uninit";

    // type Rotationizable = Rotation2D | number | string;
    // type Vectorizable =  Vector2D | [number,number] | string | number;
    // type Rectizable =  Rect2D | Array<number> | string | number;
    // type Colorizable = Color | string | number | Array<number>;
    // type Graphizable = string | Graphics2D | Polygon;
    // type Numerizable = number | string;
    // type Transfizable = string | ContextTransfProperties | ContextTransf | Object2D;

    // type ResizeCallBack<T> = (this: T, parent: Vector2D, ev: UIEvent) => any;

    // type TickEvent<T> = TickCallBack<T> & TickEventProperties;
    // type TickCallBack<T> = (this: T, ev: TickEvent<T>) => any;

    // type MouseEventInfo = MouseEvent | WheelEvent;
    // type MouseCallBack<T extends StageInteractive> = (this: T, ev: ContextMouseEvent) => any;

    // type KBCallBack<T extends StageInteractive> = (this: T, ev: KeyboardEvent) => any;

    type Polygon = [number, number][];
}

export type {
    
};