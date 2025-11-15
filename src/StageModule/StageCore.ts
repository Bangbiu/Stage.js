const DATA_CLONE: DataAssignType = "clone";
const DATA_IDEN: DataAssignType = "identical";
const DATA_UNINIT: DataAssignType = "uninit";
const ATTR_SPLITER: string = '.';
const RAW: unique symbol = Symbol("raw");
const ABORT: unique symbol = Symbol("abort");
const JTS_ALL: JSTypeSet = ["string" , "number" , "bigint" , "boolean" , "symbol" , "undefined" , "object" , "function"]
const JST_ADDABLE: JSTypeSet = ["string", "number", "bigint"];
const JST_SUBABLE: JSTypeSet = ["number"];
const JST_MULTABLE: JSTypeSet = ["number"];
const DUMMY = () => {};

const NATIVE_CTORS = [
    Object, Array, Map, Set, WeakMap, WeakSet,
    Date, RegExp, Promise, Error
] as const;

const noop = () => {};

let ASN_DEF: DataAssignType = DATA_CLONE;
let JTS_DEF: JSTypeSet = ["number", "boolean", "string"] as const;

function resolveAsCustomObject<T>(value: T): ResolvedAsObject<T> {
    if (isCustomObject(value)) 
        return value as ResolvedAsObject<T>;
    return { value } as ResolvedAsObject<T>; // Wrapper
}

function isObjectLike<T>(v: NonNullable<T>): boolean {
    return typeof v === "object" || typeof v === "function";
}

function isCustomObject(value: any): value is object {
    // Filter Out Null/Undefined
    if (value == null) return false;

    const t = typeof value;

    if (t === "function" && RAW in value) return true;
    
    // Filter Out Primitives
    if (t !== "object") return false; // exclude primitives

    const proto = Object.getPrototypeOf(value);
    if (proto === null) return false; // e.g., Object.create(null)

    
    // Filter Out Native Object
    const ctor = proto.constructor;
    if (!ctor) return false;
    if (NATIVE_CTORS.includes(ctor)) return proto === Object.prototype;

    // Anything with a constructor that's not one of the native built-ins
    // is considered a "custom class instance"
    return true;
}

function isPOJO(value: any): value is object {
    return (
        Object.prototype.toString.call(value) === "[object Object]" &&
        Object.getPrototypeOf(value) === Object.prototype
    );
}

function getAllKeys(obj: any): Array<PropertyKey> {
  const keys: PropertyKey[] = [];
  let current = obj;

  while (current !== null) {
    const own = Reflect.ownKeys(current);   // string + symbol keys
    for (const k of own) {
      if (!keys.includes(k)) keys.push(k);  // dedupe
    }
    current = Object.getPrototypeOf(current);
  }

  return keys;
}

export {
    // Constants
    DATA_CLONE,
    DATA_IDEN,
    DATA_UNINIT,
    ATTR_SPLITER,
    RAW,
    ABORT,
    JTS_ALL,
    JST_ADDABLE,
    JST_SUBABLE,
    JST_MULTABLE,
    DUMMY,

    // Variables
    ASN_DEF,
    JTS_DEF,

    // Function
    noop,
    resolveAsCustomObject,
    isCustomObject,
    isObjectLike,
    isPOJO,
    getAllKeys
}