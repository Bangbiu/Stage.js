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

type Box<T> =
    T extends number ? Number :
    T extends string ? String :
    T extends boolean ? Boolean :
    T extends symbol ? Symbol :
    T extends bigint ? BigInt :
    T;

// Checking
declare type IsObject<T> =
    T extends Primitive ? false :
    T extends Function ? false :
    T extends object ? true : false;
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
type IsCustomClassInstance<T> =
    [T] extends [object]
        ? IsFn<T> extends true 
            ? false : IsNativeObject<T> extends true 
                ? false
                : T extends any[] ? false
            : true
        : false;

type IsCustomObject<T extends object> =
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
declare type ClassType<T> = new (...args: unknown[]) => T;
declare type Constructor<T> = new (...args: unknown[]) => T;

declare interface ValueWrapper<T> {
    value: T;
}
