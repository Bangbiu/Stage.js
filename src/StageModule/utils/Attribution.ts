import { ASN_DEF, DATA_IDEN, RAW, SObject } from "./SObject.js";

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

    public constructor(owner: TObject, key: TKey) {
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

    public get(): TVal {
        return this.owner[this.key];
    }
    
    public set(value: TVal, assign: DataAssignType = ASN_DEF): this {
        this.owner[this.key] = value as TObject[TKey];
        return this;
    }

    // set(value: TObject[TKey], assign: DataAssignType = DATA_IDEN): boolean {
    //     SObject.assign(this.owner, this.name as string, value, assign);
    //     return true;
    // }

    public retriever(...args: FnParams<TVal>): Getter<TVal> {
        if (this.type === "function") {
            const func = this.get() as unknown as Function;
            return func.bind(this.owner, ...args);
        } else {
            return this.get.bind(this);
        }
    }

    public setter(value: TVal): () => this;
    public setter(): Setter<TVal>;
    public setter(value?: TVal): any {
        if (value) {
            return () => this.set(value);
        } else {
            return this.set.bind(this);
        }
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

    call(...args: AppendOptional<FnParams<TVal>, Partial<TObject>>): FnReturn<TVal> {
        const val = this.get() as unknown;
        if (typeof val === "function") {
            const thisArg = args.length > val.length ? 
                        args.pop() as TObject : this.owner;
            return val.apply(thisArg, args);
        }
        return undefined as FnReturn<TVal>;
    }

    caller(...args: AppendOptional<FnParams<TVal>, Partial<TObject>>): Caller<TVal> {
        if (this.type === "function") {
            return (() => this.call(...args)) as Caller<TVal>;
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
        // if (cur instanceof SObject && typeof cur.add === "function") {
        //     cur.add(other);
        //     return this;
        // }
        this.doWith(other, (value, other) => value as any + other);
        return this;
    }

    sub(other: number): this;
    sub(other: object): this;
    sub(other: Attribution<any, any, number>): this;
    sub(other: any): this {
        // if (cur instanceof SObject && typeof cur.sub === "function") {
        //     cur.sub(other);
        //     return this;
        // }
        if (this.isNumber())
            this.doWith(other as any, (value: any, other: any) => value - other);
        return this;
    }

    multiply(other: number): this;
    multiply(other: object): this;
    multiply(other: Attribution<any, any, number>): this;
    multiply(other: any): this {
        // const cur = this.get() as any;
        // if (cur instanceof SObject && typeof cur.multiply === "function") {
        //     cur.multiply(other);
        //     return this;
        // }

        if (this.isNumber())
            this.doWith(other as any, (value: any, other: any) => value * other);
        return this;
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
    
    static of(owner: any, prop?: PropertyKey): any {
        if (prop) {
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
