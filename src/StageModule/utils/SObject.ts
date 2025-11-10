import Attribution from "./Attribution.js";

type TraverseCallBack<T extends object> = (target: T, key: keyof T, path: KeyArrayPath<T>) => any;
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

const noop = (...argArray: any[]) => { return undefined as any };
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

    tryGet(path: KeyPath<this>, 
        success: AttemptCallBack = noop, 
        fail: AttemptCallBack = noop
    ): this {
        return SObject.tryGet(this, path, success, fail);
    }

    trySet(path: KeyPath<this>, value: any, 
        success: AttemptCallBack = noop, 
        fail: AttemptCallBack = noop, 
        assign: DataAssignType = ASN_DEF
    ): this {
        return SObject.trySet(this, path, value, success, fail, assign);
    }

    tryCall(path: MethodPath<this>, argArray: any[],
        success: AttemptCallBack = noop, 
        fail: AttemptCallBack = noop
    ) {
        return SObject.tryCall(this, path, argArray, success, fail);
    }

    getFrom(path: KeyPath<this>): any {
        return SObject.getFrom(this, path);
    }

    setIn(path: KeyPath<this>, value: any, assign: DataAssignType = ASN_DEF): boolean {
        return SObject.setIn(this, path, value, assign);
    }

    invoke(path: MethodPath<this>, args: any[], thisArg?: Object): any {
        return SObject.invoke(this, path, args, thisArg);
    }

    fetch(success: AttemptCallBack = noop, fail: AttemptCallBack = noop): this {
        return this.tryGet("", success, fail);
    }

    store(value: any, 
        success: AttemptCallBack = noop, 
        fail: AttemptCallBack = noop, 
        assign: DataAssignType = ASN_DEF
    ): this {
        return this.trySet("value", value, success, fail, assign);
    }

    get(): any {
        return this.value;
    }

    set(value: any, assign: DataAssignType = ASN_DEF) {
        return SObject.assign(this, "val", value, assign);
    }

    call(args: any[], thisArg: Object = this): any {
        if (this.valueType === "function") 
            return this.get().apply(thisArg, args);
        return noop;
    }

    getter(path: KeyPath<this>): Getter<any> {
        return this.attr(path).getter();
    }
    
    setter(path: KeyPath<this>, value?: any): Setter<any> {
        return this.attr(path).setter(value);
    }
    
    invoker(path: MethodPath<this>, args: any[], thisArg?: Object): () => any {
        const attr = this.attr(path);
        const func = attr.get();
        if (typeof func === "function") {
            if (!thisArg) thisArg = attr.owner;
            return (func as Function).bind(thisArg, ...args);
        }
        return noop;
    }

    caller(args: any[], thisArg: Object = this) {
        if (this.valueType === "function")
            return this.value.bind(thisArg, ...args);
        return noop;
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

    attr(path: KeyPath<this>): Attribution<any> {
        return SObject.getAttr(this, path);
    }

    attribution(path: KeyArrayPath<this>): Attribution<any> {
        return SObject.getAttr(this, path);
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

    subset(keys: Array<keyof this>): Partial<this> {
        return SObject.subset(this, keys);
    }

    add(other: Partial<this>, types?: JSDataType[]): this;
    add(other: any, types: JSDataType[] = JSD_DEF): this {
        return SObject.add(this, other, types) as this;
    }

    sub(other: Partial<this>, types?: JSDataType[]): this;
    sub(other: any, types: JSDataType[] = JSD_DEF): this {
        return SObject.subtract(this, other, types) as this;
    }

    multiply(other: Partial<this>, types?: JSDataType[]): this;
    multiply(other: any, types: JSDataType[] = JSD_DEF): this {
        return SObject.multiply(this, other, types) as this;
    }

    print(path?: KeyPath<this>, ...argArray: any[]): void {
        this.printer(path, ...argArray)();
    }

    printer(path?: KeyPath<this>, ...argArray: any[]): Function {
        if (path) {
            const literalPath = path instanceof Array ? path.join(ATTR_SPLITER) : path;
            const attr = this.attr(path);
            let val = attr.get();
            if (typeof val === "function") val = val.call(attr.owner)
                return () => (console.log(this.class + ATTR_SPLITER + literalPath + " = " + this.attr(path).get()));
        } else {
            return () => (console.log(this.toString()));
        }
    }

    log(path?: KeyPath<this>, ...argArray: any[]): void {
        this.logger(path, ...argArray)();
    }

    logger(path?: KeyPath<this>, ...argArray: any[]): Function {
        if (path) {
            return ()=>(console.log(this.getFrom(path)));
        } else {
            return ()=>(console.log(this.raw()));
        }
    }

    debug(msgr: (self: this) => any) {
        console.log(msgr(this));
    }

    assert(assertion: Assertion<this>) {
        console.assert(assertion(this));
        return assertion(this);
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

    static of<T extends NotPlainObj>(properties: T, assign?: DataAssignType, ..._argArray: any[]): SObject & {val: T} & T;
    static of<T>(target: T, assign?: DataAssignType, ..._argArray: any[]): SObject & T;
    static of(target: any, assign: DataAssignType = ASN_DEF, ..._argArray: any[]): any {
        return new SObject(target, assign);
    }

    static setIn<T extends object>(dest: T, path: KeyPath<T>, value: any, assign: DataAssignType = DATA_IDEN): boolean {
        return SObject.getAttr(dest, path).setIfValid(value, assign).valid;
    }

    static getFrom<T extends object>(dest: T, path: KeyPath<T>): any {
        return SObject.getAttr(dest, path).get();
    }
    
    static invoke<T extends object>(dest: T,path: MethodPath<T>, args: any[], thisArg?: Object): any {
        const attr = SObject.getAttr(dest, path);
        const func = attr.get();
        if (typeof func === "function") {
            if (!thisArg) thisArg = attr.owner;
            return (func as Function).apply(thisArg, args);
        }
        return undefined;
    }

    static tryGet<T extends object>(dest: T, path: KeyPath<T>, 
        success: AttemptCallBack = noop, 
        fail: AttemptCallBack = noop): T 
    {
        SObject.access(dest, path, 
            attr => attr.feed(success),
            attr => attr.feed(fail)
        );
        return dest;
    }

    static trySet<T extends object>(dest: T, path: KeyPath<T>, value: any, 
        success: AttemptCallBack = noop, 
        fail: AttemptCallBack = noop, 
        assign: DataAssignType = DATA_IDEN): T 
    {
        SObject.access(dest, path, 
            attr => { attr.set(value, assign); attr.feed(success); },
            attr => { attr.feed(fail) }
        );
        return dest;
    }
    
    static tryCall<T extends object>(dest: T, path: MethodPath<T>, argArray: any[],
        success: AttemptCallBack = noop, 
        fail: AttemptCallBack = noop
    ): T {
        SObject.tryGet(dest, path, 
            (func, target, key) => {
                if (typeof func === "function")
                    success((func as Function).apply(target, argArray), target, key);
                else
                    fail(func, target, key);
            },
            fail
        )
        return dest;
    }

    static access<T extends object>(dest: T, path: KeyPath<T>, success?: AccessAttemptCallBack, fail?: AccessAttemptCallBack): Attribution<any> {
        const attr = SObject.getAttr(dest, path);
        if (attr.valid && success) 
            success.call(dest, attr);
        else if (fail) 
            fail.call(dest, attr);
        return attr;
    }

    static apply<T extends object>(dest: T, source: Partial<T>, fn: BiFunction<any, any, any>, types: JSDataType[]): T;
    static apply<T extends object>(dest: T, source: any, fn: BiFunction<any, any, any>, types: JSDataType[] = JSD_DEF): T {
        const srcObj = source instanceof Object ? source : { val: source };
        const callBack: TraverseCallBack<T> = (_target, _key, path) => {
            SObject.access(srcObj as T, path, 
                attr => SObject.getAttr(dest, path).doWith(attr, fn)
            );
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
                // Clone not Needed
                return target;
            }
            default: { return target; }
        }
    }

    static resolveKeyPath<T extends object>(path: KeyPath<T>): KeyArrayPath<T> {
        return path instanceof Array ? path : path.split(ATTR_SPLITER) as KeyArrayPath<T>;
    }

    static getAttr<T extends object>(target: T, path: KeyPath<T>): Attribution<any> {
        return this.getAttribution(target, [...SObject.resolveKeyPath(path)]);
    }

    /** Modifies keys Array, Be sure to save a copy */
    static getAttribution<T extends object>(target: T, keys: KeyArrayPath<T>): Attribution<any> {
        let curName = keys.shift() as keyof T;
        if (keys.length <= 0 || !(curName in target)) return Attribution.of(target, curName);
        const nextTarget = curName === "" ? target : target[curName] as T;
        return SObject.getAttribution(nextTarget, keys);
    }

    static has<T extends object>(target: T, keys: Array<PropertyKey>): boolean {
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
    new <T extends NotPlainObj>(properties: T, assign?: DataAssignType): SObject & {val: Widen<T>} & T;
    new <T>(properties: T, assign?: DataAssignType): SObject & T;
} & typeof SObject;