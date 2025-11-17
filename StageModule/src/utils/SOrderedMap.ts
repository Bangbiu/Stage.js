import { DATA_IDEN } from "../core/StageCore.js";
import { SObject } from "./SObject.js";

type MapEntry<K extends PropertyKey, V> = [K, V];

export default class SOrderedMap<K extends PropertyKey, V> extends SObject {
    private keys: K[] = [];
    constructor(entries?: object | Array<MapEntry<K, V>>) {
        super()
        if (entries) {
            if (entries instanceof Array)
                for (const [k, v] of entries) this.put(k, v);
            else {
                this.keys = Object.keys(entries) as K[];
                this.insertValues(entries);
            }
        }
    }

    put(key: K, value: V, assign: DataAssignType = DATA_IDEN) {
        if (!this.has(key)) this.keys.push(key);
        this.assign(key, value, assign);
    }

    /** Get value by key or index */
    get(keyOrIndex: K | number): V | undefined {
        if (typeof keyOrIndex === "number") {
            return this.valueAt(keyOrIndex);
        }
        return this.getFrom(keyOrIndex);
    }

    /** Get key by index */
    keyAt(index: number): K | undefined {
        return this.keys[index];
    }

    /** Get value by index */
    valueAt(index: number): V | undefined {
        if (index >= 0 && index < this.keys.length) {
            const key = this.keys[index];
            return key !== undefined ? this.getFrom(key) : undefined;
        }
        return undefined;
    }

    /** Number of entries */
    get size() { return this.keys.length; }

    /** Iterate in order */
    *[Symbol.iterator]() {
        for (const key of this.keys) {
            yield [key, this.get(key)] as [K, V];
        }
    }

    static flat<K extends PropertyKey, V>(arr: Array<MapEntry<K, V>>): object {
        const obj = Object.create(Object.prototype);
        for (const [key, value] of arr) {
            (obj as any)[key] = value;
        }
        return obj;
    }
}
