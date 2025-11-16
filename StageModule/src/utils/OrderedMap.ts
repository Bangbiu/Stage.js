type MapEntry<K extends PropertyKey, V> = [K, V];

export default class OrderedMap<K extends PropertyKey, V> {
    private keys: K[] = [];
    private values = new Map<K, V>();

    constructor(entries?: Array<MapEntry<K, V>>) {
        if (entries) {
            for (const [k, v] of entries) this.set(k, v);
        }
    }

    /** Set value by key */
    set(key: K, value: V) {
        if (!this.values.has(key)) {
            this.keys.push(key);
        }
        this.values.set(key, value);
    }

    /** Get value by key or index */
    get(keyOrIndex: K | number): V | undefined {
        if (typeof keyOrIndex === "number") {
            const key = this.keys[keyOrIndex];
            return key !== undefined ? this.values.get(key) : undefined;
        }
        return this.values.get(keyOrIndex);
    }

    /** Get key by index */
    keyAt(index: number): K | undefined {
        return this.keys[index];
    }

    /** Get value by index */
    valueAt(index: number): V | undefined {
        const key = this.keys[index];
        return key !== undefined ? this.values.get(key) : undefined;
    }

    /** Number of entries */
    get size() { return this.keys.length; }

    /** Iterate in order */
    *[Symbol.iterator]() {
        for (const key of this.keys) {
            yield [key, this.values.get(key)!] as [K, V];
        }
    }
}
