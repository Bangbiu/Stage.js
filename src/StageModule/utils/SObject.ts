import Attribution from "./Attribution.js";

type TraverseCallBack<T extends object> = (target: T, key: keyof T, path: KeyArrayPath<T>) => any;
type GetAttemptCallBack = (attr: any) => any;
type AccessAttemptCallBack = (attr: Attribution<any>) => any;

export {
    // Constants
    DATA_CLONE,
    DATA_IDEN,
    DATA_UNINIT,
    ATTR_SPLITER,
    RAW,

    // Variables
    ASN_DEF,
    
    // Class
    SObjectExporter as SObject,
}

const DATA_CLONE: DataAssignType = "clone";
const DATA_IDEN: DataAssignType = "identical";
const DATA_UNINIT: DataAssignType = "uninit";
const ATTR_SPLITER: string = '.';
const RAW: unique symbol = Symbol("raw");

const DoNothing = (...argArray: any[]) => { return undefined as any };
const TraverseLogger = <T extends object>(target: T, key: keyof T, path: KeyArrayPath<T>) => 
    console.log(path, target[key]);
    // console.log(path.join(ATTR_SPLITER) + ": ", target[key]);

let ASN_DEF: DataAssignType = DATA_CLONE;
let JSD_DEF: JSDataType[] = ["number", "boolean", "string"];

class SObject implements Reproducable {
    private [RAW]: this;
    constructor( properties?: any, assign: DataAssignType = ASN_DEF) {
        this[RAW] = this;
        if (properties) {
            if (typeof properties === "object" && 
                (Object.getPrototypeOf(properties) === Object.prototype || 
                    properties instanceof SObject)) 
                this.insertValues(properties, assign);
            else
                this.assign("value", properties, assign);
        }
        SObject.COUNT++;
        return new Proxy(this, {
            get: (target, prop, receiver) => {
                if (prop === RAW) return target; // expose raw

                // 1) Check the dynamic object's own members first
                const own = Reflect.get(target, prop, receiver);
                if (own !== undefined) {
                    return typeof own === "function" ? own.bind(receiver) : own;
                }

                // 2) Fallback to target.value (supports primitives via boxing)
                const v = (target as any).value;
                if (!v) return undefined;

                // If it's a primitive, box it so we can safely look up props/methods
                const box = (typeof v === "object" || typeof v === "function") ? v : Object(v);

                if (prop in box) {
                    // Use `box` as the receiver so getters/methods see correct `this`
                    const fromValue = Reflect.get(box, prop, box);
                    return typeof fromValue === "function" ? fromValue.bind(box) : fromValue;
                }

                // 3) Missing
                return undefined;
            },
        });
    }

    protected raw(): this {
        return this[RAW];
    }

    get class(): string {
        return this.constructor.name;
    }

    get value(): any {
        return (this as any).val;
    }

    set value(val: any) {
        (this as any).val = val;
    }

    get valueType() {
        return typeof (this as any).val;
    }
    copy(source: Partial<this>): this {
        return this.updateValues(source, ASN_DEF);
    }

    clone(): this {
        return new SObject(this) as this;
    }

    setValues( values: Partial<this> = {}, assign: DataAssignType = ASN_DEF ): this {
        return SObject.setValues(this, values, assign);
    }

    updateValues( values: Partial<this> = {}, assign: DataAssignType = ASN_DEF ): this {
        SObject.updateValues(this, values, assign);
        this.resolveAll();
        return this;
    }

    insertValues( values: object = {}, assign: DataAssignType =ASN_DEF ): this {
        return SObject.insertValues(this, values, assign);
    }

    tryGet(path: KeyPath<this>, success?: GetAttemptCallBack, fail?: GetAttemptCallBack): any {
        return SObject.tryGet(this, path, success, fail);
    }

    trySet(path: KeyPath<this>, value: any, assign: DataAssignType = ASN_DEF): this {
        return SObject.trySet(this, path, value, assign);
    }

    set(value: any): this {
        this.value = value;
        return this;
    }

    assign(key: string, value: any, type: DataAssignType = ASN_DEF): this {
        return SObject.assign(this, key, value, type);
    }

    access(path: KeyPath<this>, success?: AccessAttemptCallBack, fail?: AccessAttemptCallBack): Attribution<any, keyof any> {
        return SObject.access(this, path, success, fail);
    }

    has(keys: Array<PropertyKey>): boolean {
        return SObject.has(this, keys);
    }

    resolve<K extends keyof this, R extends object>(key: K, cls: Constructor<R>): Opt<R> {
        return SObject.resolve(this, key, cls);
    }

    resolveAll(other: object = this): object {
        return other;
    }

    attribution(path: KeyPath<this>): Attribution<any> {
        return SObject.getAttribution(this, path);
    }
    
    chain(...path: KeyArrayPath<this>): PathValue<this> {
        return undefined as PathValue<this>;
    }

    traverse(callback: TraverseCallBack<this> = TraverseLogger, 
        rootPath: KeyArrayPath<this> = [], 
        types: JSDataType[] = JSD_DEF): this 
    {
        return SObject.traverse(this, callback, rootPath, types);
    }

    getter(path: KeyPath<this>): Getter<any> {
        return this.access(path).retriever();
    }
    
    setter(path: KeyPath<this>): Setter<any> {
        const attr = this.access(path);
        return attr.valid ? attr.setter() : DoNothing;
    }

    subset(keys: Array<keyof this>): Partial<this> {
        return SObject.subset(this, keys);
    }

    add(other: object, types?: JSDataType[]): this;
    add(other: Partial<this>, types?: JSDataType[]): this;
    add(other: any, types: JSDataType[] = JSD_DEF): this {
        return SObject.add(this, other, types) as this;
    }

    sub(other: object, types?: JSDataType[]): this;
    sub(other: Partial<this>, types?: JSDataType[]): this;
    sub(other: any, types: JSDataType[] = JSD_DEF): this {
        return SObject.subtract(this, other, types) as this;
    }

    multiply(other: object, types?: JSDataType[]): this;
    multiply(other: Partial<this>, types?: JSDataType[]): this;
    multiply(other: any, types: JSDataType[] = JSD_DEF): this {
        return SObject.multiply(this, other, types) as this;
    }

    print(path?: KeyPath<this>, ...argArray: any[]): void {
        this.printer(path, ...argArray)();
    }

    printer(path?: KeyPath<this>, ...argArray: any[]): Function {
        if (path) {
            const callee = this.attribution(path).retriever(...argArray);
            const literalPath = path instanceof Array ? path.join(ATTR_SPLITER) : path;
            return () => (console.log(this.class + ATTR_SPLITER + literalPath + " = " + callee()));
        } else {
            return () => (console.log(this.toString()));
        }
    }

    log(path?: KeyPath<this>, ...argArray: any[]): void {
        this.logger(path, ...argArray)();
    }

    logger(path?: KeyPath<this>, ...argArray: any[]): Function {
        if (path) {
            const callee = this.attribution(path).retriever(...argArray);
            return ()=>(console.log(callee()));
        } else {
            return ()=>(console.log(this.raw()));
        }
    }

    toString(): string {
        return `[${this.class} = ${this.value}]`;
    }

    equals<T extends object>(other: T): boolean {
        return SObject.equals(this, other);
    }

    deepEqual<T extends object>(other: T): boolean {
        return SObject.deepEqual(this, other);
    }

    static of<T extends Primitive>(target: T, assign?: DataAssignType, ..._argArray: any[]): SObject & {val: T} & T;
    static of<T extends object>(target: T, assign?: DataAssignType, ..._argArray: any[]): SObject & T;
    static of(target: any, assign: DataAssignType = ASN_DEF, ..._argArray: any[]): any {
        return new SObject(target, assign);
    }

    static tryGet<T extends object>(dest: T, path: KeyPath<T>, success?: GetAttemptCallBack, fail?: GetAttemptCallBack): any {
        const gotCallBack = success ? (attr: Attribution<any, keyof any>) => (success.call(dest, attr.get())) : DoNothing as GetAttemptCallBack;
        const failCallBack = fail ? () => (fail.call(dest, undefined)) : DoNothing as GetAttemptCallBack;
        const attr = SObject.access(dest, path, gotCallBack, failCallBack);
        return attr.get();
    }

    static trySet<T extends object>(dest: T, path: KeyPath<T>, value: any, assign: DataAssignType = DATA_IDEN): T {
        const attr = SObject.access(dest, path);
        if (attr.valid) attr.set(value, assign);
        return dest;
    }

    static access<T extends object>(dest: T, path: KeyPath<T>, success?: AccessAttemptCallBack, fail?: AccessAttemptCallBack): Attribution<any> {
        const attr = SObject.getAttribution(dest, path);
        if (attr.valid) {
            if (success) success.call(dest, attr);
        } else if (fail) 
            fail.call(dest, attr);
        return attr;
    }

    static apply<T extends object>(dest: T, source: Partial<T>, fn: BiFunction<any, any, any>, types: JSDataType[]): T;
    static apply<T extends object>(dest: T, source: any, fn: BiFunction<any, any, any>, types: JSDataType[] = JSD_DEF): T {
        const srcObj = source instanceof Object ? source : { val: source };
        const callBack: TraverseCallBack<T> = (dest, _, path) => {
            const srcAttr = SObject.access(srcObj as T, path);
            if (srcAttr.valid) 
                SObject.access(dest, path).doWith(srcAttr, fn);
            return true;
        };
        SObject.traverse(dest, callBack, [], types);
        return dest;
    }

    static add<T extends object>(dest: T, source: Addable): T;
    static add<T extends object>(dest: T, source: Partial<T>, types: JSDataType[]): T;
    static add<T extends object>(dest: T, source: any, types: JSDataType[] = JSD_DEF): T {
        return this.apply(dest, source, (v1, v2) => v1 + v2, types);
    }

    static subtract<T extends object>(dest: T, source: Partial<T>, types: JSDataType[] = JSD_DEF): T {
        return this.apply(dest, source, (v1, v2) => v1 - v2, types);
    }

    static multiply<T extends object>(dest: T, source: Partial<T>, types: JSDataType[] = JSD_DEF): T {
        return this.apply(dest, source, (v1, v2) => v1 * v2, types);
    }

    static traverse<T extends object>(target: T, callback: TraverseCallBack<T>, rootPath: KeyArrayPath<T> = [], types: JSDataType[] = JSD_DEF): T {
        for (const key in target) {
            const value = target[key];
            const curPath = [...rootPath, key] as unknown as KeyArrayPath<T>;
            if (typeof value === "object") 
                SObject.traverse(value as T, callback, curPath, types);
            if (types.includes(typeof value)) {          
                if (callback(target, key, curPath) === false) return target;
            }
        }
        return target;
    }    


    static initialize<T extends object>(target: T, values: Partial<T>, def: Partial<T>, assign: DataAssignType = ASN_DEF): T {
        SObject.setValues(target, def, ASN_DEF);
        SObject.updateValues(target, values, assign);
        return target;
    }

    static setValues<T extends object>(target: T, values: Partial<T>, assign: DataAssignType = ASN_DEF): T {
        for (const key in values) {
            SObject.assign(target, key, values[key],assign);
        }
        return target;
    }

    static updateValues<T extends object>(target: T, values: Partial<T>, assign: DataAssignType = ASN_DEF): T {
        for (const key in values) {  
            if (key in target) {
                SObject.assign(target, key, values[key], assign);
            } else {
                SObject.trySet(target, key, values[key], assign);
            }
        }
        return target;
    }

    static insertValues<T extends object, V extends object>(target: T, values: V, assign: DataAssignType = ASN_DEF): T {
        for (const key in values) {
            if (!(key in target)) 
                SObject.assign(target, key, values[key], assign);
        }
        return target;
    }


    static assign<T>(target: T, key: keyof T | string, value: any, type: DataAssignType = ASN_DEF): T {
        switch (type) {
            case DATA_CLONE: {
                (target as any)[key] = SObject.clone(value);
                //console.log(key + ":" + value);
                break;
            }
            case DATA_IDEN: {
                (target as any)[key] = value;
                break;
            }
        }
        return target;
    }

    static resolve<T extends object, K extends keyof T, R extends object>
    (
        target: T,
        key: K,
        cls: Constructor<R>
    ): Opt<R> {
        const val = target[key];
        if (val !== undefined && !(val instanceof cls)) {
            target[key] = new cls(val) as T[K];
            return target[key] as R;
        }
        return undefined;
    }

    static copy<T extends object>(target: T, source: Partial<T>): T {
        return SObject.updateValues(target, source, DATA_CLONE);  
    }

    static clone<T>(target: T): T {
        if (!target) return target;
        switch (typeof target) {
            case "object": {
                if ("clone" in target) 
                    return (target["clone"] as Function)() as T;
                else if (target instanceof Array) {
                    const result = Array<ElementType<T>>();
                    target.forEach(element => result.push(SObject.clone(element)));
                    return result as unknown as T;
                } else if (target instanceof Map) {
                    return new Map(
                        Array.from(target, ([k, v]) => [SObject.clone(k), SObject.clone(v)])
                    ) as T;
                } else if (target instanceof Set) {
                    return new Set(
                        Array.from(target, (v) => SObject.clone(v))
                    ) as T;
                } else if (target instanceof Date) {
                    return new Date(target) as T;
                } else {
                    return SObject.setValues(Object.create(target.constructor.prototype), target, DATA_CLONE);
                }
            }
            case "function": {
                const func = function(...argArray: any[]) {
                    return target(...argArray);
                };
                Object.assign(func, target);
                return func as unknown as T;
            }
            default: { return target; }
        }
    }

    static getAttribution<T extends object>(target: T, path: KeyPath<T>): Attribution<any> {
        const arrPath = path instanceof Array ? [...path] : path.split(ATTR_SPLITER);
        return this.getAttrHelper(target, arrPath as KeyArrayPath<T>);
    }

    static getAttrHelper<T extends object>(target: T, keys: KeyArrayPath<T>): Attribution<any> {
        let curName = keys.shift() as keyof T;
        if (keys.length <= 0) return new Attribution(target, curName) as any;
        return SObject.getAttrHelper(target[curName] as T, keys);
    }

    static has(target: object, keys: Array<PropertyKey>): boolean {
        for (let i = 0; i < keys.length; i++) {
            if (!(keys[i] in target)) return false;
        }
        return true;
    }

    static equals(a: any, b: any): boolean {
        if (a === b) return true;

        // If one is null/undefined or types differ
        if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;

        // Share constructor (preserves Date/RegExp/etc. identity)
        // if (a.constructor !== b.constructor) return false;

        // Array
        if (Array.isArray(a)) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
            return true;
        }

        // Map
        if (a instanceof Map) {
            if (a.size !== b.size) return false;
            for (const [k, v] of a) if (!b.has(k) || b.get(k) !== v) return false;
            return true;
        }

        // Set (reference/primitive shallow membership)
        if (a instanceof Set) {
            if (a.size !== b.size) return false;
            for (const v of a) if (!b.has(v)) return false;
            return true;
        }

        // Date / RegExp
        if (a instanceof Date) return a.getTime() === b.getTime();
        if (a instanceof RegExp) return a.source === b.source && a.flags === b.flags;

        // Plain objects (own enumerable keys, === value check)
        const ka = Object.keys(a);
        const kb = Object.keys(b);
        if (ka.length !== kb.length) return false;
        for (const k of ka) {
            if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
            if (a[k] !== b[k]) return false;
        }
        return true;
    }

    static deepEqual(a: any, b: any): boolean {
        if (a === b) return true; // handles primitives + identical refs
        if (a && b && typeof a === "object" && typeof b === "object") {
            if (a.constructor !== b.constructor) return false;

            // Handle Arrays
            if (Array.isArray(a)) {
                if (a.length !== b.length) return false;
                return a.every((val, i) => SObject.deepEqual(val, b[i]));
            }

            // Handle Maps
            if (a instanceof Map) {
                if (a.size !== b.size) return false;
                for (const [key, val] of a) {
                    if (!b.has(key) || !SObject.deepEqual(val, b.get(key))) return false;
                }
                return true;
            }

            // Handle Sets
            if (a instanceof Set) {
                if (a.size !== b.size) return false;
                for (const val of a)
                    if (![...b].some((v) => SObject.deepEqual(v, val))) return false;
                return true;
            }

            // Handle Dates and RegExps
            if (a instanceof Date) return a.getTime() === b.getTime();
            if (a instanceof RegExp) return a.source === b.source && a.flags === b.flags;

            // Handle plain objects
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) return false;

            return keysA.every(k => keysB.includes(k) && SObject.deepEqual(a[k], b[k]));
        }
        // If one is object and other isn’t
        return false;
    }

    static subset<T extends object>(target: T, keys: Array<keyof T>): Partial<T> {
        const result = new SObject({}) as unknown as Partial<T>;
        keys.forEach(key => {
            if (key in target) result[key] = target[key];
        });
        return result;
    }

    private static COUNT: number = 0;
}


const SObjectExporter = SObject as {
    new <T extends NotPlainObj>(properties: T, assign?: DataAssignType): SObject & {val: T} & T;
    new <T>(properties: T, assign?: DataAssignType): SObject & T;
} & typeof SObject;