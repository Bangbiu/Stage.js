import { DUMMY, isObjectLike, RAW } from "../StageCore.js";

export default function WrapperProxy<T extends ValueWrapper<any>>(obj: T): T {
    return new Proxy(DUMMY as unknown as T, {
        get: (_target, prop, receiver) => {
            if (prop === RAW) return obj; // expose raw

            // 1) Check the dynamic object's own members first
            const own = Reflect.get(obj, prop, receiver);
            if (own !== undefined) {
                return typeof own === "function" ? own.bind(receiver) : own;
            }

            // 2) Fallback to target.value (supports primitives via boxing)
            const v = obj.value;
            if (v == null) return v;

            // If it's a primitive, box it so we can safely look up props/methods
            const box = isObjectLike(v) ? v : Object(v);
            if (prop in box) {
                // Use `box` as the receiver so getters/methods see correct `this`
                const fromValue = Reflect.get(box, prop, box);
                return typeof fromValue === "function" ? fromValue.bind(box) : fromValue;
            }

            // 3) Missing
            return undefined;
        },

        set: (_target, prop, value, _recv) => {
            // Never allow overwriting the raw escape hatch
            if (prop === RAW) return false;

            // 1) Own fields (including "value") live on the wrapper itself
            if (prop in obj) {
                return Reflect.set(obj, prop, value, obj);
            }

            // 2) Try to forward into target.value if it exists
            const v = obj.value;
            if (v != null) {
                if (isObjectLike(v)) {
                    const box = Object(v);
                    if (prop in box) {
                        // Use `box` as the receiver so setters/getters see the correct `this`
                        const ok = Reflect.set(box, prop, value, box);
                        // If v is primitive, writing to the boxed wrapper won't persist — signal failure
                        return ok;
                    }
                }
                return false;
            }

            // 3) Otherwise, create/override the property on the wrapper itself
            (obj as any)[prop as any] = value;
            return true;
        },

        has: (_target, prop) => {
            if (prop in obj) return true;
            const v = obj.value;
            if (v == null) return false;
            return prop in (isObjectLike(v) ? v : Object(v));
        },

        apply: (_target, thisArg, argArray) => {
            const v = obj.value;
            if (typeof v !== "function") {
                throw new TypeError("This Object is not Callable");
            }
            // default `this` to the wrapper so methods can see the wrapper if desired
            const recv = thisArg ?? obj;
            return Reflect.apply(v, recv, argArray);
        },

        construct: (_target, argArray, newTarget) => {
            const v = obj.value;
            if (typeof v !== "function") {
                throw new TypeError("This Object is not Constructible");
            }
            return Reflect.construct(v, argArray, newTarget);
        },

        ownKeys(_target) {
            return Reflect.ownKeys(obj);
        },

        getOwnPropertyDescriptor(_target, key) {
            // MUST return a descriptor so the key becomes enumerable
            return {
                configurable: true,
                enumerable: true,
                writable: true,
                value: (obj as any)[key]
            };
        }
    });
}