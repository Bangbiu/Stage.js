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

// Checking
declare type IsObject<T> =
    T extends Primitive ? false :
    T extends Function ? false :
    T extends object ? true : false;
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

// Intellisense
declare type LoosePartialObject<T extends object> =
    Partial<T> | (Partial<T> & { [K in Exclude<PropertyKey, keyof T>]?: unknown }); // + extras

declare type LoosePartial<T> =
    T extends NonCustomObject ? T :
    T extends object ? LoosePartialObject<T> :
    T;

declare type ValueOfKeys<K extends JSTypeSet> = JSTypeMap[K[number]];
declare type JSTypeSet = readonly (keyof JSTypeMap)[];
declare type DefTypeSet = ["number", "boolean", "string"];
declare type TypeOfSet<K extends JSTypeSet> = JSTypeMap[K[number]];

// Enum
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
declare type NativeObject =
    | Array<unknown>
    | readonly unknown[]   // covers tuples and ReadonlyArray
    | Function
    | Date
    | RegExp
    | Map<unknown, unknown>
    | Set<unknown>
    | WeakMap<object, unknown>  // WeakMap keys must be objects
    | WeakSet<object>;          // WeakSet items must be objects
declare type Addable = string | number | bigint;
declare type Subable = number;
declare type Multable = number;
declare type NonCustomObject = Primitive | NativeObject

// Function
declare type AnyFunction = (...args: any[]) => any;
declare type BiFunction<T1, T2, R> = (arg1: T1, arg2: T2) => R;
declare type UnaryFunction<T, R> = (input: T) => R;
declare type FnParams<T> = T extends (...args: infer A) => any ? A : never;
declare type FnReturn<T> = T extends (...args: any[]) => infer R ? R : undefined;
declare type AppendOptional<T extends any[], E> = [...T, E?];
// Array
declare type ElementType<T> = T extends (infer U)[] ? U : never;
// Class
declare type ClassType<T> = new (...args: unknown[]) => T;
declare type Constructor<T> = new (...args: unknown[]) => T;

declare interface ValueWrapper<T> {
    value: T;
}