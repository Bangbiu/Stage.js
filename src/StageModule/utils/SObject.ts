import { 
    ABORT,
    ASN_DEF, 
    ATTR_SPLITER, 
    DATA_CLONE, 
    DATA_IDEN, 
    RAW, 

    noop, 
    
    isCustomObject, 
    resolveAsCustomObject,
    DUMMY
} from "../StageCore.js";
import WrapperProxy from "./WrapperProxy.js";

type CallBackAttr<R1 extends object, R2 extends object> = 
    Or<IsWrapper<R1>, IsWrapper<R2>> extends true ? Attribution<R1> : Attribution<any>;
    
type AccessAttemptCallBack = (attr: Attribution<any>) => any;
type TraverseCallBack<R extends object> = (
    attr: IsWrapper<R> extends true ? Attribution<R> : Attribution<any>,
    path: KeyArrayPath<R>,
    root: R
) => OpsReturn;
type InteractCallBack<R1 extends object, R2 extends object> = (
    attr1: CallBackAttr<R1, R2>,
    attr2: CallBackAttr<R2, R1>,
    path: KeyArrayPath<R1 & R2>,
    root1: R1,
    root2: R2
) => OpsReturn;

const TraverseLogger: TraverseCallBack<any> = (attr, path) => 
    console.log(path, " = ", attr.get());
    // console.log(path.join(ATTR_SPLITER) + ": ", target[key]);

const InteractLogger: InteractCallBack<any, any> = (a1, a2, p) =>
    console.log(p, "=", a1.get(), a2.get());
    

class SObject implements Reproducable, ValueWrapper<any> {
    public value: any;
    private [RAW]: this;
    constructor( properties?: any, assign: DataAssignType = ASN_DEF ) {
        this[RAW] = this;
        if (properties) {
            if (isCustomObject(properties)) 
                this.setValues(properties, assign);
            else {
                this.set(properties, assign);
            }
        }
        SObject.COUNT++;
    }

    get class(): string {
        return this.constructor.name;
    }

    get valueType() {
        return "val" in this ? typeof this.val : typeof undefined;
    }

    raw(): this {
        return this[RAW];
    }

    keys(): keyof this {
        return Object.keys(this) as unknown as keyof this;
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

    tryCall(path: MethodPath<this>, args: any[],
        success: AttemptCallBack = noop, 
        fail: AttemptCallBack = noop
    ) {
        return SObject.tryCall(this, path, args, success, fail);
    }

    getFrom(path: KeyPath<this>): any {
        return SObject.getFrom(this, path);
    }

    extract(...path: KeyArrayPath<this>): PathValue<this> {
        return this.getFrom(path);
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
        return SObject.assign(this, "value", value, assign);
    }

    call(args: any[] = [], thisArg: Object = this): any {
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

    has(key: PropertyKey): boolean {
        return key in this;
    }

    hasAll(keys: Array<PropertyKey>): boolean {
        return SObject.hasAll(this, keys);
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

    traverse(callback: TraverseCallBack<this> = TraverseLogger): this {
        return SObject.traverse(this, callback);
    }

    interact<T extends LoosePartial<this>>(
        target: T | LoosePartial<this>,
        callback: InteractCallBack<this, ResolvedAsObject<T>> = InteractLogger
    ): this {
        return SObject.act(this, target, callback as any);
    }

    subset(keys: Array<keyof this>): Partial<this> {
        return SObject.subset(this, keys);
    }

    add(other: Partial<this>): this;
    add(other: any): this {
        return SObject.add(this, other) as this;
    }

    sub(other: Partial<this>): this;
    sub(other: any): this {
        return SObject.subtract(this, other) as this;
    }

    multiply(other: Partial<this>): this;
    multiply(other: any): this {
        return SObject.multiply(this, other) as this;
    }

    print(path?: KeyPath<this>, ...args: any[]): void {
        this.printer(path, ...args)();
    }

    printer(path?: KeyPath<this>, ...args: any[]): Function {
        if (path !== undefined) {
            const header = this.class + ATTR_SPLITER + 
                (path instanceof Array ? path.join(ATTR_SPLITER) : path);
            const attr = this.attr(path);
            return attr.type === "function" ? 
                () => console.log(`${header}(${args}) = ${attr.call(args)}`) : 
                () => console.log(`${header} = ${attr.get()}`);
        } else {
            return () => console.log(this.toString());
        }
    }

    msg(path?: KeyPath<this>, ...args: any[]): void {
        this.msgr(path, ...args)();
    }

    msgr(path?: KeyPath<this>, ...args: any[]): () => void {
        if (path !== undefined) {
            const attr = this.attr(path);
            return attr.type === "function" ? 
                () => console.log(attr.call(args)) : 
                () => console.log(attr.get());
        } else {
            return () => console.log(this.raw());
        }
    }

    debug(callback: (self: this) => any = self => self.raw()) {
        console.log(callback(this));
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

    static of<T>(properties: NonCustomObject<T>, assign?: DataAssignType, ..._args: any[]): SObject & BoxedWrapper<T>;
    static of<T>(target: CustomObject<T>, assign?: DataAssignType, ..._args: any[]): SObject & T;
    static of(target: any, assign: DataAssignType = ASN_DEF, ..._args: any[]): any {
        const raw = new SObject(target, assign);
        return isCustomObject(target) ? raw : WrapperProxy(raw);
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
    
    static tryCall<T extends object>(dest: T, path: MethodPath<T>, args: any[],
        success: AttemptCallBack = noop, 
        fail: AttemptCallBack = noop
    ): T {
        SObject.tryGet(dest, path, 
            (func, target, key) => {
                if (typeof func === "function")
                    success((func as Function).apply(target, args), target, key);
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

    static add<T extends object>(dest: T, source: Addable): T;
    static add<T extends object>(dest: T, source: Partial<T>): T;
    static add<T extends object>(dest: T, source: any): T {
        return this.apply(dest, source, (v1, v2) => v1 + v2);
    }

    static subtract<T extends object>(dest: T, source: Partial<T>): T {
        return this.apply(dest, source, (v1, v2) => v1 - v2);
    }

    static multiply<T extends object>(dest: T, source: Partial<T>): T {
        return this.apply(dest, source, (v1, v2) => v1 * v2);
    }

    static traverse<T extends object>(
        target: T,  
        callback: TraverseCallBack<T> = TraverseLogger, 
        rootPath: Array<PropertyKey> = [],
        root: T = target
    ): T {
        for (const key in target) {
            const attr = Attribution.of(target, key);
            const curPath = [...rootPath, key] as unknown as KeyArrayPath<T>;
            const ret = callback(attr as any, curPath, root);
            if (ret === ABORT) return target;
            else if (ret === false) continue;
            const value = attr.get();
            if (isCustomObject(value))
                SObject.traverse(value as T, callback, curPath, root);
        }
        return target;
    } 

    static act<T1, T2>(
        target1: T1, 
        target2: T2 | LoosePartial<T1>,
        callback: InteractCallBack<ResolvedAsObject<T1>, ResolvedAsObject<T2>> = InteractLogger,
        rootPath: KeyArrayPath<ResolvedAsObject<T1> & ResolvedAsObject<T2>> = []
    ): T1 {
        const t1 = resolveAsCustomObject(target1) as object;
        const t2 = resolveAsCustomObject(target2) as object; 
        return SObject.interact(t1, t2, callback, rootPath) as T1;
    }

    static interact<
        T1 extends object, T2 extends LoosePartialObject<T1>,
        R1 extends object = T1, R2 extends object = T2>
    (
        target1: T1, 
        target2: T2 | LoosePartialObject<T1>, 
        callback: InteractCallBack<R1, R2> = InteractLogger,
        rootPath: Array<PropertyKey> = [],
        root1: R1 = target1 as unknown as R1, 
        root2: R2 = target2 as unknown as R2
    ): R1 {
        for (const key in target1) {
            if (SObject.hasKey(target2, key)) {
                const attr1 = Attribution.of(target1, key);
                const attr2 = Attribution.of(target2, key);
                const curPath = [...rootPath, key] as any;
                const ret = callback(attr1 as any, attr2 as any, curPath, root1, root2);
                if (ret === ABORT) return root1;
                else if (ret === false) continue;
                const value1 = attr1.get();
                const value2 = attr2.get();
                if (isCustomObject(value1) && isCustomObject(value2)) 
                    SObject.interact(value1, value2, callback, curPath, root1, root2);       
            }
        }
        return root1;
    }

    static apply<T extends object>(dest: T, source: Partial<T>, fn: BiFunction<any, any, any>): T;
    static apply<T extends object>(dest: T, source: any, fn: BiFunction<any, any, any>): T {
        const srcObj = source instanceof Object ? source : { value: source };
        const callBack: TraverseCallBack<T> = (_attr, path) => {
            SObject.access(srcObj as T, path, 
                attr => SObject.getAttr(dest, path).doWith(attr, fn)
            );
            return true;
        };
        SObject.traverse(dest, callBack);
        return dest;
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
        const curName = keys.shift() as keyof T;
        if (keys.length <= 0 || !SObject.hasKey(target, curName)) {
            return Attribution.of(target, curName);
        }
        // Skip Empty Key
        const nextTarget = curName === "" ? target : target[curName] as T;
        return SObject.getAttribution(nextTarget, keys);
    }

    static subset<T extends object>(target: T, keys: Array<keyof T>): Partial<T> {
        const result = new SObject({}) as unknown as Partial<T>;
        keys.forEach(key => {
            if (key in target) result[key] = target[key];
        });
        return result;
    }

    static hasAll<T extends object>(target: T, keys: Array<PropertyKey>): boolean {
        for (let i = 0; i < keys.length; i++) {
            if (!(keys[i] in target)) return false;
        }
        return true;
    }

    static hasKey<T extends object>(obj: T, key: PropertyKey): key is keyof T {
        return key in obj;
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

    private static COUNT: number = 0;
}


const SObjectExporter = SObject as {
    new <T>(properties: NonCustomObject<T>, assign?: DataAssignType): SObject & ValueWrapper<Widen<T>>;
    new <T>(properties: CustomObject<T>, assign?: DataAssignType): SObject & T;
} & typeof SObject;

class Attribution<
    TObject extends Record<PropertyKey, any>,
    TKey extends keyof TObject = keyof TObject,
    TVal = TObject[TKey]
> extends SObject implements Attributive<TObject, TKey> {

    public readonly owner: TObject;
    public readonly key: TKey;
    public readonly valid: boolean;

    private constructor(owner: TObject, key: TKey) {
        super();
        this.owner = owner;
        this.key = key;
        this.valid = key in owner;
    }

    public get type(): JSDataType {
        return typeof this.get();
    }

    public typeOf<T extends JSDataType>(dataType: T): 
        this is Attribution<TObject, TKey, JSTypeMap[T]> 
    {
        return this.type === dataType;
    }

    public instanceOf<T extends object>(ctor: Constructor<T>):
        this is Attribution<TObject, TKey, T>
    {
        const v = this.get();
        return v != null && v instanceof ctor;
    }

    public isNumber(): this is Attribution<TObject, TKey, number> {
        return this.typeOf("number");
    }

    public isString(): this is Attribution<TObject, TKey, string> {
        return this.typeOf("string");
    }

    public sameTypeWith<T>(other: T): this is Attribution<TObject, TKey, T>  {
        return this.type === typeof other;
    }

    public get(): TVal {
        return this.owner[this.key];
    }

    public getAsType<T extends JSDataType>(dataType: T, callback: (val: JSTypeMap[T]) => any) {
        if (this.typeOf(dataType)) {
            callback(this.get() as JSTypeMap[T]);
        }
    }

    public getAsInstance<T extends object>(
        ctor: Constructor<T>,
        callback: (val: T) => any
    ) {
        const v = this.get() as unknown;
        if (v != null && v instanceof ctor) {
            callback(v as T);
        }
    }
    
    public set(value: TVal, assign: DataAssignType = ASN_DEF): this {
        SObject.assign(this.owner, this.key, value, assign);
        return this;
    }

    public setIfValid(value: TVal, assign: DataAssignType = ASN_DEF): this {
        if (this.valid) this.set(value, assign);
        return this;
    }

    public getter(): Getter<TVal> {
        return this.get.bind(this);
    }

    public setter(value: TVal): () => this;
    public setter(): Setter<TVal>;
    public setter(value?: TVal): any {
        if (value)
            return this.set.bind(this, value);
        else
            return this.set.bind(this);
    }

    call(args: FnParams<TVal> = [] as any, thisArg: Object = this.owner): FnReturn<TVal> {
        if (this.typeOf("function")) 
            return (this.get() as Function).apply(thisArg, args);
        return undefined as FnReturn<TVal>;
    }

    caller(args: FnParams<TVal>, thisArg: Object = this.owner): Caller<TVal> {
        if (this.type === "function") {
            return (this.get() as Function).bind(thisArg, ...args);
        }
        return undefined as Caller<TVal>;
    }    

    do(operation: UnaryFunction<TVal, TVal>): this {
        this.set(operation(this.get()));
        return this;
    }

    doWith(other: TVal | Attribution<any, any, TVal>, operation: BiFunction<TVal, TVal, TVal>): this {
        if (other instanceof Attribution) {
            this.doWith(other.get(), operation);
        } else if (this.type === "object") {
            // SObject
            console.log("obj");
            
        } else {
            this.set(operation(this.get(), other));
        }
        return this;
    }

    calc(fn: UnaryFunction<TVal, TVal>): TVal {
        return fn(this.get());
    }

    add(other: TVal): this;
    add(other: object): this;
    add(other: Attribution<any, any, TVal>): this;
    override add(other: any): this {
        if (this.owner instanceof SObject) 
            this.owner.add(other);
        else
            this.doWith(other, (value, other) => value as any + other);
        return this;
    }

    sub(other: number): this;
    sub(other: object): this;
    sub(other: Attribution<any, any, number>): this;
    sub(other: any): this {
        if (this.owner instanceof SObject) 
            this.owner.sub(other);
        else if (this.isNumber()) 
            this.doWith(other as any, (value: any, other: any) => value - other);
        return this;
    }

    multiply(other: number): this;
    multiply(other: object): this;
    multiply(other: Attribution<any, any, number>): this;
    multiply(other: any): this {
        if (this.owner instanceof SObject) 
            this.owner.sub(other);
        else if (this.isNumber())
            this.doWith(other as any, (value: any, other: any) => value * other);
        return this;
    }

    feed(callback: AttemptCallBack) {
        callback(this.get(), this.owner, this.key);
    }

    static attributize<T>(data: T[]): Attribution<ValueWrapper<T>, "value">[];
    static attributize(data: any[]): Attribution<Object, any>[] {
        const attrs: Attribution<Object, any>[] = [];
        data.forEach((elem) => {
            if (elem instanceof Attribution) {
                attrs.push(elem);
            } else attrs.push(Attribution.of(elem))
        });
        return attrs;
    }

    // 1) Object + key → Attribution<TObj, TKey>
    static of<TObj extends object, TKey extends keyof TObj>(
        owner: TObj,
        prop: TKey
    ): Attribution<TObj, TKey>;

    // 2) Object with "value" (no key) → Attribution<TObj, "value">
    static of<VT, TObj extends ValueWrapper<VT>>(owner: TObj): Attribution<TObj, "value">;

    // 3) Non-object (primitive, etc.) → Attribution<ValueWrapper<T>, "value">
    static of<T>(value: T): Attribution<ValueWrapper<Widen<T>>, "value"> & Widen<T>;
    
    // 4) owner it self reference
    // static of<T>(owner: T, prop: ""): Attribution<ValueWrapper<Widen<T>>, "value"> & Widen<T>;
    
    static of(owner: any, prop?: PropertyKey): any {
        if (prop !== undefined && prop !== "") {
            return new Attribution(owner, prop);
        } else {
            if (typeof owner === "object" && "value" in owner) {
                // Plain object with a "value" field
                return new Attribution(owner, "value");
            } else {
                // Wrap into an SObject with a "value" field
                return new Attribution({ value: owner }, "value");
            }
        }
    }
}

export {
    SObjectExporter as SObject,
    Attribution
}