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
    JST_ADDABLE,
    JST_SUBABLE,
    JST_MULTABLE
} from "../core/StageCore.js";
import WrapperProxy from "./WrapperProxy.js";


declare type KeyPath<T extends Object> = string | Array<PropertyKey> | KeyArrayPath<T>;

// arrays/tuples should use numeric indexes only, not "length"/methods
declare type IndexKey<T> = Extract<keyof T, PropertyKey>;

/** Paths that may stop at any depth (prefixes allowed). */
// depth-limited KeyArrayPath
declare type KeyArrayPath<T, D extends Depth = 5> =
  // if we've hit depth 0, fall back to a generic PropertyKey[]
  D extends 0
    ? Array<PropertyKey>
    : IsFn<T> extends true
      // functions: your original base case
      ? Array<PropertyKey>
      : T extends object
        ? {
            [K in IndexKey<T>]:
              [K, ...KeyArrayPath<T[K], Dec<D>>]
          }[IndexKey<T>]
        // non-objects: your original base case
        : Array<PropertyKey>;

declare type OpsReturn = Voidable<boolean | symbol | object>

declare type AccessAttemptCallBack = (attr: Attribution) => any;
declare type TraverseCallBack<R extends object> = (
    attr: Attribution,
    path: KeyArrayPath<R>,
    root: R
) => OpsReturn;
declare type InteractCallBack<R1 extends object, R2 extends object> = (
    attr1: Attribution,
    attr2: Attribution,
    path: KeyArrayPath<R1 & R2>,
    root1: R1,
    root2: R2
) => OpsReturn;

declare type AttrDoCallback<A extends Attribution> 
    = (attr: A, curValue: any, otherValue: any) => OpsReturn;


// Generator
declare interface TraverseItem<T extends object> {
    attr: Attribution;
    path: KeyArrayPath<T>;
    root: T;
};

declare interface InteractItem<R1 extends object, R2 extends object> {
    attr1: Attribution;
    attr2: Attribution;
    path: KeyArrayPath<R1 & R2>;
    root1: R1;
    root2: R2;
};


const TraverseLogger: TraverseCallBack<any> = (attr, path) => 
    console.log(path, " = ", attr.get());
    // console.log(path.join(ATTR_SPLITER) + ": ", target[key]);

const InteractLogger: InteractCallBack<any, any> = (a1, a2, p) =>
    console.log(p, "=", a1.get(), a2.get());
    

class SObject implements Reproducable, ValueWrapper<any> {
    public value: any;
    private [RAW]?: this;
    constructor( properties?: any, assign: DataAssignType = ASN_DEF ) {
        if (properties) {
            if (isCustomObject(properties)) 
                this.setValues(properties, assign);
            else {
                this.set(properties, assign);
            }
        }
        SObject.COUNT++;
    }

    get className(): string {
        return this.constructor.name;
    }

    get valueType() {
        return typeof this.value;
    }

    raw(): Opt<this> {
        return this[RAW];
    }

    copy<T extends SObject>(source: T): this;
    copy(source: Partial<this>): this;
    copy(source: any): this {
        return this.updateValues(source, ASN_DEF);
    }

    clone(): this {
        return new SObject(this) as this;
    }

    thisKeys(): Array<PropertyKey> {
        return Object.keys(this) as unknown as Array<keyof this>;
    }

    class<Ctor = typeof SObject>(): Ctor {
        return this.constructor as Ctor;
    }

    setValues( values: LoosePartialObject<this> = {}, assign: DataAssignType = ASN_DEF ): this {
        return SObject.setValues(this, values, assign);
    }

    updateValues( values: Partial<this> = {}, assign: DataAssignType = ASN_DEF ): this {
        return SObject.updateValues(this, values, assign);
    }

    insertValues( values: object = {}, assign: DataAssignType = ASN_DEF ): this {
        return SObject.insertValues(this, values, assign);
    }

    initialize(values: Partial<this>, def: Partial<this>, assign: DataAssignType = ASN_DEF): this {
        return SObject.initialize(this, values, def, assign);
    }

    //tryGet(path: KeyPath<this>, success: AttemptCallBack, fail: AttemptCallBack): this;
    tryGet(path: KeyPath<this>, success: AttemptCallBack = noop, fail: AttemptCallBack = noop
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

    tryCall(path: KeyPath<this>, args: any[],
        success: AttemptCallBack = noop, 
        fail: AttemptCallBack = noop
    ) {
        return SObject.tryCall(this, path, args, success, fail);
    }

    getFrom(path: keyof this): any;
    getFrom(path: PropertyKey): any;
    getFrom(path: KeyPath<this>): any;
    getFrom(path: any): any {
        return SObject.getFrom(this, path);
    }

    extract(...path: KeyArrayPath<this>): any {
        return this.getFrom(path);
    }

    setIn(path: keyof this, value: any, assign?: DataAssignType): boolean;
    setIn(path: KeyPath<this>, value: any, assign?: DataAssignType): boolean;
    setIn(path: any, value: any, assign: DataAssignType = ASN_DEF): boolean {
        return SObject.setIn(this, path, value, assign);
    }

    invoke(path: keyof this, args?: any[], thisArg?: Object): any;
    invoke(path: KeyPath<this>, args?: any[], thisArg?: Object): any;
    invoke(path: any, args: any[] = [], thisArg?: Object): any {
        return SObject.invoke(this, path, args, thisArg);
    }

    fetch(success: AttemptCallBack = noop, fail: AttemptCallBack = noop): this {
        return this.tryGet("", success, fail);
    }

    replace(value: any, 
        success: AttemptCallBack = noop, 
        fail: AttemptCallBack = noop, 
        assign: DataAssignType = ASN_DEF
    ): this {
        return this.trySet("value", value, success, fail, assign);
    }

    get(..._args: any[]): any {
        return this.value;
    }


    set(value: any, assign: DataAssignType = ASN_DEF): this {
        return SObject.assign(this, "value", value, assign);
    }

    call(args: any[] = [], thisArg: Object = this): any {
        if (this.valueType === "function") 
            return this.get().apply(thisArg, args);
        return noop;
    }

    getter(path: keyof this): Getter<any>
    getter(path: KeyPath<this>): Getter<any>;
    getter(path: any): Getter<any> {
        return this.attr(path).getter();
    }
    
    setter(path: keyof this, value?: any): Setter<any, Attribution>;
    setter(path: KeyPath<this>, value?: any): Setter<any, Attribution>;
    setter(path: any, value?: any): Setter<any, Attribution> {
        return this.attr(path).setter(value);
    }
    
    invoker(path: keyof this, args?: any[], thisArg?: Object): () => any
    invoker(path: KeyPath<this>, args?: any[], thisArg?: Object): () => any
    invoker(path: any, args: any[] = [], thisArg?: Object): () => any {
        return () => SObject.invoke(this, path, args, thisArg);
    }

    caller(args: any[], thisArg: Object = this) {
        if (this.valueType === "function")
            return this.value.bind(thisArg, ...args);
        return noop;
    }

    assign(key: keyof this, value: any, type?: DataAssignType): this;
    assign(key: PropertyKey, value: any, type?: DataAssignType): this;
    assign(key: any, value: any, type: DataAssignType = ASN_DEF): this {
        return SObject.assign(this, key, value, type);
    }

    access(path: keyof this, success?: AccessAttemptCallBack, fail?: AccessAttemptCallBack): Attribution;
    access(path: KeyPath<this>, success?: AccessAttemptCallBack, fail?: AccessAttemptCallBack): Attribution;
    access(path: any, success?: AccessAttemptCallBack, fail?: AccessAttemptCallBack): Attribution {
        return SObject.access(this, path, success, fail);
    }

    has(key: keyof this): boolean;
    has(key: PropertyKey): boolean;
    has(key: any): boolean {
        return key in this;
    }

    hasAll(keys: Array<PropertyKey>): boolean {
        return SObject.hasAll(this, keys);
    }

    resolve<K extends keyof this, R extends object>(key: K, cls: Constructor<R>): Opt<R> {
        return SObject.resolve(this, key, cls);
    }

    resolveAll<T extends object>(cls: Constructor<T>): this {
        for (const key in this) this.resolve(key, cls);
        return this;
    }

    attr(path: keyof this): Attribution
    attr(path: KeyPath<this>): Attribution;
    attr(path: any): Attribution {
        return SObject.getAttr(this, path);
    }

    attribution(path: KeyArrayPath<this>): Attribution {
        return SObject.getAttr(this, path);
    }

    traverse(callback: TraverseCallBack<this> = TraverseLogger): this {
        return SObject.traverse(this, callback);
    }

    *traversal(rootPath: Array<PropertyKey> = []): Generator<TraverseItem<this>, void, OpsReturn> {
        yield* SObject.traversal(this, rootPath);
    }

    interact<T extends LoosePartial<this>>(
        target: T | LoosePartial<this>,
        callback: InteractCallBack<this, ResolvedAsObject<T>> = InteractLogger
    ): this {
        return SObject.act(this, target, callback as any);
    }

    *interaction<T>(
        target: T,
        rootPath: Array<PropertyKey> = []
    ): Generator<InteractItem<ResolvedAsObject<this>, ResolvedAsObject<T>>, void, OpsReturn> {
        yield* SObject.action(this, target, rootPath);
    }

    *[Symbol.iterator]() {
        yield* this.traversal();
    }

    subset(keys: Array<keyof this>): SObject & Partial<this> {
        return SObject.subset(this, keys);
    }

    unwrap(): object {
        return SObject.unwrap(this);
    }
    
    add<T extends SObject>(other: T): this;
    add(other: Partial<this>): this;
    add(other: any): this;
    add(other: any): this {
        return SObject.add(this, other) as this;
    }

    sub(other: Partial<this>): this;
    sub(other: any): this {
        return SObject.sub(this, other) as this;
    }

    mult(other: Partial<this>): this;
    mult(other: any): this {
        return SObject.mult(this, other) as this;
    }

    print(path?: keyof this, ...args: any[]): void;
    print(path?: KeyPath<this>, ...args: any[]): void;
    print(path?: any, ...args: any[]): void {
        this.printer(path, ...args)();
    }

    printer(path?: keyof this, ...args: any[]): Function
    printer(path?: KeyPath<this>, ...args: any[]): Function
    printer(path?: any, ...args: any[]): Function {
        if (path !== undefined) {
            const joinedPath = path instanceof Array ? 
                path.join(ATTR_SPLITER) : path as unknown as Array<string>;
            const header = this.className + ATTR_SPLITER + joinedPath;
            const attr = this.attr(path);
            return attr.type === "function" ? 
                () => console.log(`${header}(${args}) = ${attr.call(args)}`) : 
                () => console.log(`${header} = ${attr.get()}`);
        } else {
            return () => console.log(this.toString());
        }
    }

    msg(path?: keyof this, ...args: any[]): void;
    msg(path?: KeyPath<this>, ...args: any[]): void;
    msg(path?: any, ...args: any[]): void {
        this.msgr(path, ...args)();
    }

    msgr(path?: keyof this, ...args: any[]): Function
    msgr(path?: KeyPath<this>, ...args: any[]): Function
    msgr(path?: any, ...args: any[]): Function {
        if (path !== undefined) {
            const attr = this.attr(path);
            return attr.type === "function" ? 
                () => console.log(attr.call(args)) : 
                () => console.log(attr.get());
        } else {
            return () => console.log(this);
        }
    }

    debug(callback: (self: this) => any = self => self) {
        console.log(callback(this));
    }

    assert(assertion: Assertion<this>) {
        console.assert(assertion(this));
        return this;
    }

    toString(): string {
        return `[${this.className} = ${this.value}]`;
    }

    equals<T extends object>(other: T): boolean {
        return SObject.equals(this, other);
    }

    deepEqual<T extends object>(other: T): boolean {
        return SObject.deepEqual(this, other);
    }

    static of<T>(properties: NonCustomObject<T>, assign?: DataAssignType, ..._args: any[]): SObject & BoxedWrapper<T>;
    static of<T>(target: CustomObject<T>, assign?: DataAssignType, ..._args: any[]): SObject & T;
    static of(target: any, assign: DataAssignType = ASN_DEF, ..._args: any[]): SObject {
        const raw = new SObject(target, assign);
        if (isCustomObject(target)) {
            return raw;
        } else {
            raw[RAW] = raw;
            return WrapperProxy(raw);
        }
    }

    static setIn<T extends object>(dest: T, path: keyof T, value: any, assign?: DataAssignType): boolean
    static setIn<T extends object>(dest: T, path: KeyPath<T>, value: any, assign?: DataAssignType): boolean;
    static setIn<T extends object>(dest: T, path: any, value: any, assign: DataAssignType = DATA_IDEN): boolean {
        return SObject.getAttr(dest, path).setIfValid(value, assign).valid;
    }

    static getFrom<T extends object>(dest: T, path: keyof T): any;
    static getFrom<T extends object>(dest: T, path: KeyPath<T>): any;
    static getFrom<T extends object>(dest: T, path: any): any {
        return SObject.getAttr(dest, path).get();
    }

    static invoke<T extends object>(dest: T,path: keyof T, args?: any[], thisArg?: Object): any;
    static invoke<T extends object>(dest: T,path: KeyPath<T>, args?: any[], thisArg?: Object): any;
    static invoke<T extends object>(dest: T,path: any, args: any[] = [], thisArg?: Object): any {
        const attr = SObject.getAttr(dest, path);
        const func = attr.get();
        if (typeof func === "function") {
            if (!thisArg) thisArg = attr.owner;
            return (func as Function).apply(thisArg, args);
        }
        return ABORT;
    }

    static tryGet<T extends object>(dest: T, path: keyof T, success?: AttemptCallBack, fail?: AttemptCallBack): T;
    static tryGet<T extends object>(dest: T, path: KeyPath<T>, success?: AttemptCallBack, fail?: AttemptCallBack): T;
    static tryGet<T extends object>(dest: T, path: any, success: AttemptCallBack = noop, fail: AttemptCallBack = noop): T 
    {
        SObject.access(dest, path, 
            attr => attr.feed(success),
            attr => attr.feed(fail)
        );
        return dest;
    }

    static trySet<T extends object>(dest: T, path: keyof T, value: any, 
        success?: AttemptCallBack, 
        fail?: AttemptCallBack, 
        assign?: DataAssignType): T 
    static trySet<T extends object>(dest: T, path: KeyPath<T>, value: any, 
        success?: AttemptCallBack, 
        fail?: AttemptCallBack, 
        assign?: DataAssignType): T 
    static trySet<T extends object>(dest: T, path: any, value: any, 
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

    static tryCall<T extends object>(dest: T, path: keyof T, args: any[],
        success?: AttemptCallBack, 
        fail?: AttemptCallBack
    ): T
    static tryCall<T extends object>(dest: T, path: KeyPath<T>, args: any[],
        success?: AttemptCallBack, 
        fail?: AttemptCallBack
    ): T
    static tryCall<T extends object>(dest: T, path: any, args: any[],
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

    static access<T extends object>(dest: T, path: keyof T, success?: AccessAttemptCallBack, fail?: AccessAttemptCallBack): Attribution
    static access<T extends object>(dest: T, path: KeyPath<T>, success?: AccessAttemptCallBack, fail?: AccessAttemptCallBack): Attribution;
    static access<T extends object>(dest: T, path: any, success?: AccessAttemptCallBack, fail?: AccessAttemptCallBack): Attribution {
        const attr = SObject.getAttr(dest, path);       
        if (attr.valid && success) 
            success.call(dest, attr);
        else if (fail) 
            fail.call(dest, attr);
        return attr;
    }


    static add<T1, T2>(
        target1: T1, 
        target2: T2 | LoosePartial<T1>): T1 
    {
        return SObject.act(target1, target2, this.ADDING);
    }

    static sub<T1, T2>(
        target1: T1, 
        target2: T2 | LoosePartial<T1>): T1 
    {
        return SObject.act(target1, target2, this.SUBING);
    }

    static mult<T1, T2>(
        target1: T1, 
        target2: T2 | LoosePartial<T1>): T1 
    {
        return SObject.act(target1, target2, this.MULTING);
    }

    static traverse<T extends object>(
        target: T,
        callback: TraverseCallBack<T> = TraverseLogger
    ): T {
        const genator = SObject.traversal(target);
        let item = genator.next();
        while(!item.done) {
            const { attr, path, root } = item.value;
            item = genator.next(callback(attr, path, root));
        }
        return target;
    }


    static *traversal<T extends object>(
        target: T,
        rootPath: Array<PropertyKey> = [],
        root: T = target
    ): Generator<TraverseItem<T>, void, OpsReturn> {
        for (const key in target) {
            const attr = Attribution.of(target, key);
            const path = [...rootPath, key] as any;
            const ret = yield { attr, path, root };
            if (ret === ABORT) return;
            else if (ret === false) continue;
            const value = attr.get();
            if (isCustomObject(value)) {
                yield* SObject.traversal(value as T, path, root);
            }
        }
    }


    static act<T1, T2>(
        target1: T1, 
        target2: T2 | LoosePartial<T1>,
        callback: InteractCallBack<ResolvedAsObject<T1>, ResolvedAsObject<T2>> = InteractLogger,
        rootPath: Array<PropertyKey> = []
    ): T1 {
        const t1 = resolveAsCustomObject(target1) as object;
        const t2 = resolveAsCustomObject(target2) as object; 
        return SObject.interact(t1, t2, callback, rootPath) as T1;
    }

    static *action<T1, T2>(
        target1: T1, 
        target2: T2 | LoosePartial<T1>,
        rootPath: Array<PropertyKey> = []
    ): Generator<InteractItem<ResolvedAsObject<T1>, ResolvedAsObject<T2>>, void, OpsReturn> {
        const t1 = resolveAsCustomObject(target1) as object;
        const t2 = resolveAsCustomObject(target2) as object; 
        yield* SObject.interaction(t1, t2, rootPath);
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
        const genator = SObject.interaction(target1, target2, rootPath, root1, root2);
        let item = genator.next();
        while (!item.done) {
            const { attr1, attr2, path, root1, root2 } = item.value;
            item = genator.next(callback(attr1, attr2, path, root1, root2));
        }
        return root1;
    }

    static *interaction<
        T1 extends object,
        T2 extends LoosePartialObject<T1>,
        R1 extends object = T1,
        R2 extends object = T2
    >(
        target1: T1,
        target2: T2 | LoosePartialObject<T1>,
        rootPath: Array<PropertyKey> = [],
        root1: R1 = target1 as unknown as R1,
        root2: R2 = target2 as unknown as R2
    ): Generator<InteractItem<R1, R2>, void, OpsReturn> {
        for (const key in target1) {
            if (SObject.hasKey(target2, key)) {
                const attr1 = Attribution.of(target1, key);
                const attr2 = Attribution.of(target2, key);
                const path = [...rootPath, key] as any;
                const directive = yield {
                    attr1,
                    attr2,
                    path,
                    root1,
                    root2
                };
                if (directive === ABORT) return;
                if (directive === false) continue;
                const value1 = attr1.get();
                const value2 = attr2.get();
                if (isCustomObject(value1) && isCustomObject(value2)) {
                    yield* SObject.interaction(
                        value1,
                        value2,
                        path,
                        root1,
                        root2
                    );
                }
            }
        }
        return;
    }

    static initialize<T extends object>(target: T, values: Partial<T>, def: Partial<T>, assign: DataAssignType = ASN_DEF): T {
        for (const key in def) {
            if (key in values) 
                SObject.assign(target, key, (values as any)[key], assign);
            else
                SObject.assign(target, key, (def as any)[key], assign);
        }
        return target;
    }

    static setValues<T extends object>(target: T, values: LoosePartialObject<T>, assign: DataAssignType = ASN_DEF): T {
        for (const key in values) {
            SObject.assign(target, key, (values as any)[key], assign);
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


    static assign<T>(target: T, key: keyof T | PropertyKey, value: any, type: DataAssignType = ASN_DEF): T {
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
        if (path instanceof Array)
            return path as KeyArrayPath<T>;
        else if (typeof path === "string")
            return path.split(ATTR_SPLITER) as KeyArrayPath<T>;
        else
            return [path] as unknown as KeyArrayPath<T>;
    }

    static getAttr<T extends object>(target: T, path: keyof T): Attribution
    static getAttr<T extends object>(target: T, path: KeyPath<T>): Attribution
    static getAttr<T extends object>(target: T, path: any): Attribution {
        return this.getAttribution(target, [...SObject.resolveKeyPath(path)]);
    }

    /** Modifies keys Array, Be sure to save a copy */
    static getAttribution<T extends object>(target: T, keys: KeyArrayPath<T>): Attribution {
        const curName = keys.shift() as keyof T;
        if (keys.length <= 0 || !SObject.hasKey(target, curName)) {
            return Attribution.of(target, curName);
        }
        // Skip Empty Key
        const nextTarget = curName === "" ? target : target[curName] as T;
        return SObject.getAttribution(nextTarget, keys);
    }
    
    static subset<T extends object>(target: T, keys: Array<keyof T>): SObject & Partial<T> {
        const result = new SObject({}) as SObject & Partial<T>;
        keys.forEach(key => {
            if (key in target) result.assign(key, target[key], DATA_IDEN);
        });
        return result;
    }

    static unwrap<T>(obj: T): T;
    static unwrap(obj: object): object {
        if (typeof obj === "function" && RAW in obj) return SObject.unwrap((obj as any)[RAW]);
        if (isCustomObject(obj)) {
            const src = obj as any;
            const out: any = Object.create(Object.prototype);
            for (const key in src) {
                if (key in Object.getPrototypeOf(obj)) continue;
                const value = src[key];
                if (isCustomObject(obj)) {
                    out[key] = SObject.unwrap(value);
                } else {
                    out[key] = value;
                }
            }
            return out;
        }
        return obj;
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
        const aval = SObject.isSObject(a) ? a.unwrap() : a;
        const bval = SObject.isSObject(b) ? b.unwrap() : b;
        if (aval && bval && typeof aval === "object" && typeof bval === "object") {
            if (aval.constructor !== bval.constructor) return false;
            
            // Handle Arrays
            if (Array.isArray(aval)) {
                if (aval.length !== bval.length) return false;
                return aval.every((val, i) => SObject.deepEqual(val, bval[i]));
            }

            // Handle Maps
            if (aval instanceof Map) {
                if (aval.size !== bval.size) return false;
                for (const [key, val] of aval) {
                    if (!bval.has(key) || !SObject.deepEqual(val, bval.get(key))) return false;
                }
                return true;
            }

            // Handle Sets
            if (aval instanceof Set) {
                if (aval.size !== bval.size) return false;
                for (const val of aval)
                    if (![...bval].some((v) => SObject.deepEqual(v, val))) return false;
                return true;
            }

            // Handle Dates and RegExps
            if (aval instanceof Date) return aval.getTime() === bval.getTime();
            if (aval instanceof RegExp) return aval.source === bval.source && aval.flags === bval.flags;

            // Handle plain objects
            const keysA = Object.keys(aval);
            const keysB = Object.keys(bval);
            if (keysA.length !== keysB.length) return false;
            
            return keysA.every(k => keysB.includes(k) && SObject.deepEqual(aval[k], bval[k]));
        }
        // If one is object and other isn’t
        return false;
    }

    static isSObject(target: any): target is SObject {
        if (Object.getPrototypeOf(target) === SObject.prototype) return true;
        if (typeof target == "function" && RAW in target && target[RAW] instanceof SObject) return true;
        return false;
    }
    
    static ADDING: InteractCallBack<any, any> = (a1, a2) => {
        if (a1.shareTypeSet(a2, JST_ADDABLE)) {
            a1.add(a2);
        }
    }

    static SUBING: InteractCallBack<any, any> = (a1, a2) => {
        if (a1.shareTypeSet(a2, JST_SUBABLE)) {
            a1.sub(a2);
        }
    }

    static MULTING: InteractCallBack<any, any> = (a1, a2) => {
        if (a1.shareTypeSet(a2, JST_MULTABLE)) {
            a1.mult(a2);
        }
    }

    private static COUNT: number = 0;
}


const SObjectExporter = SObject as {
    new <T>(properties: NonCustomObject<T>, assign?: DataAssignType): SObject & ValueWrapper<T>;
    new <T>(properties: CustomObject<T>, assign?: DataAssignType): SObject & T;
} & typeof SObject;

class Attribution extends SObject {

    public readonly owner: Record<PropertyKey, any>;
    public readonly key: PropertyKey;
    public readonly valid: boolean;

    private constructor(owner: object, key: PropertyKey) {
        super();
        this.owner = owner;
        this.key = key;
        this.valid = key in owner;
    }

    public get type(): JSDataType {
        return typeof this.get();
    }

    public isTypeOf<T extends JSDataType>(dataType: T): boolean
    {
        return this.type === dataType;
    }

    public objectFrom<T extends object>(ctor: Constructor<T>): boolean {
        const v = this.get();
        return v != null && v instanceof ctor;
    }

    public isNumber(): boolean {
        return this.isTypeOf("number");
    }

    public isString(): boolean {
        return this.isTypeOf("string");
    }

    public sameTypeWith<T>(other: T): boolean  {
        return this.type === typeof other;
    }

    public shareTypeOf<T>(other: Attribution, dataType: JSDataType): boolean
    {
        return this.type === dataType && other.type === dataType;
    }

    public shareTypeSet<const T extends JSTypeSet>
        (other: Attribution, typeSet: T): boolean
    {
        return typeSet.includes(this.type) && typeSet.includes(other.type);
    }

    public get(): any {
        return (this.owner as any)[this.key];
    }

    public getAsType<T extends JSDataType>(dataType: T, callback: (val: JSTypeMap[T]) => any) {
        if (this.isTypeOf(dataType)) {
            callback(this.get() as JSTypeMap[T]);
        }
    }

    public getAsInstance<T extends object = object>(
        ctor: ClassType<T>,
        callback: (val: T) => any
    ) {
        const v = this.get() as unknown;
        if (v != null && v instanceof ctor) {
            callback(v as T);
        }
    }
    
    public set(value: any, assign: DataAssignType = ASN_DEF): this {
        SObject.assign(this.owner, this.key, value, assign);
        return this;
    }

    public setIfValid(value: any, assign: DataAssignType = ASN_DEF): this {
        if (this.valid) this.set(value, assign);
        return this;
    }

    public getter(): Getter<any> {
        return this.get.bind(this);
    }

    public setter(value: any): () => this;
    public setter(): Setter<any, this>;
    public setter(value?: any): any {
        if (value) return this.set.bind(this, value);
        else return this.set.bind(this);
    }

    call(args: any[] = [], thisArg: Object = this.owner): any {
        if (this.isTypeOf("function")) 
            return (this.get() as Function).apply(thisArg, args);
        return undefined as FnReturn<any>;
    }

    caller(args: any[] = [], thisArg: Object = this.owner): any {
        if (this.type === "function") {
            return (this.get() as Function).bind(thisArg, ...args);
        }
        return undefined as Caller<any>;
    }

    do<T>(
        target: T | Attribution,
        callback: AttrDoCallback<this>
    ): this {
        const otherValue = target instanceof Attribution ? target.get() : target;
        const curValue = this.get();
        if (curValue == null || otherValue == null) return this;
        callback(this, curValue, otherValue);
        return this;
    }

    calc(fn: UnaryFunction<any, any>): any {
        return fn(this.get());
    }

    add(other: any): this {
        this.do(other, (attr, curValue, otherValue) => {
            if (typeof curValue === "object")
                if (curValue instanceof SObject) curValue.add(otherValue);
                else SObject.add(curValue, otherValue);
            else if (typeof otherValue !== "object") 
                attr.set(curValue + otherValue, DATA_IDEN);
        });
        return this;
    }

    sub(other: any): this {
        this.do(other, (attr, curValue, otherValue) => {
            if (typeof curValue === "object")
                if (curValue instanceof SObject) curValue.sub(otherValue);
                else SObject.sub(curValue, otherValue);
            else if (typeof otherValue !== "object") 
                attr.set(curValue as any - otherValue as any, DATA_IDEN);
        });
        return this;
    }

    mult(other: any): this {
        this.do(other, (attr, curValue, otherValue) => {
            if (typeof curValue === "object")
                if (curValue instanceof SObject) curValue.mult(otherValue);
                else SObject.mult(curValue, otherValue);
            else if (typeof otherValue !== "object") 
                attr.set(curValue as any * otherValue as any, DATA_IDEN);
        });
        return this;
    }

    feed(callback: AttemptCallBack) {
        callback(this.get(), this.owner, this.key);
    }

    toString(): string {
        return `[${this.className}: ${Object.getPrototypeOf(this.owner)}[${this.key.toString()}]]`;
    }

    static attributize(data: any[]): Attribution[] {
        const attrs: Attribution[] = [];
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
    ): Attribution;

    // 2) Object with "value" (no key) → Attribution<TObj, "value">
    static of<VT, TObj extends ValueWrapper<VT>>(owner: TObj): Attribution;

    // 3) Non-object (primitive, etc.) → Attribution<ValueWrapper<T>, "value">
    static of<T>(value: T): Attribution & Widen<T>;
    
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
    SObject as SObjectBase,
    Attribution
}

export type {
    KeyPath,
    KeyArrayPath,
    IndexKey
}