import { ASN_DEF, SObject } from "./SObject.js";

interface Attributive<
    TObject extends Record<PropertyKey, any>,
    TKey extends keyof TObject = keyof TObject
> {
    readonly owner: TObject;
    readonly key: TKey;
}

interface ValueWrapper<T> {
    value: T;
}

export default class Attribution<
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

    public get value(): TVal {
        return this.get();
    }

    public get type(): JSDataType {
        return typeof this.get();
    }

    public isNumber(): this is Attribution<TObject, TKey, number> {
        return typeof this.get() === "number";
    }

    public isString(): this is Attribution<TObject, TKey, string> {
        return this.type === "string";
    }

    public sameTypeWith<T>(other: T): this is Attribution<TObject, TKey, T>  {
        return this.type === typeof other;
    }

    public get(): TVal {
        return this.owner[this.key];
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

    call(args: FnParams<TVal>, thisArg: Object = this.owner): FnReturn<TVal> {
        const val = this.get() as unknown;
        if (typeof val === "function") return val.apply(thisArg, args);
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
    static of<TObj extends object & { value: any }>(owner: TObj): Attribution<TObj, "value">;

    // 3) Non-object (primitive, etc.) → Attribution<ValueWrapper<T>, "value">
    static of<T>(value: T): Attribution<ValueWrapper<Widen<T>>, "value"> & Widen<T>;
    
    // 4) owner it self reference
    // static of<T>(owner: T, prop: ""): Attribution<ValueWrapper<Widen<T>>, "value"> & Widen<T>;
    
    static of(owner: any, prop?: PropertyKey): any {
        if (prop && prop !== "") {
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
