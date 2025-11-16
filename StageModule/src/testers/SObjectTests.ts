import { SObject } from "../utils/SObject.js";
import { Tester } from "./Tester.js";

interface Social {
    github: string,
    twitter: string,
}

interface Profile {
    username: string,
    email: string,
    social: Social
}

interface Post {
    id: number, 
    title: string, 
    likes: number
}
interface Behavior {
    read: (text: string) => string;
}

interface Person {
    id: number;
    name: string;
    active: boolean;
    score: number;
    tags: Array<string>;
    profile: Profile;
    posts: Array<Post>;
    coordinates: [number, number];
    metadata: Map<string, Date>;
    favoriteNumbers: Set<number>;
    behavior: Behavior;
    greet: (name: string) => string;
}

const complexObject: Person = {
    id: 12345,
    name: "Daniel Han",
    active: true,
    score: 99.7,
    tags: ["developer", "engineer", "otaku"],

    // nested object
    profile: {
        username: "EmptyHundred",
        email: "daniel@example.com",
        social: {
            github: "https://github.com/Bangbiu",
            twitter: "@daniel_han",
        },
    },

    // array of objects
    posts: [
        { id: 1, title: "Hello World", likes: 10 },
        { id: 2, title: "TypeScript Generics", likes: 50 },
    ],

    // tuple
    coordinates: [32.7157, -117.1611] as [number, number],

    // map and set
    metadata: new Map([
        ["lastLogin", new Date("2025-11-08T10:00:00Z")],
    ]),
    favoriteNumbers: new Set([1, 2, 3, 5, 8, 13]),

    behavior: {
        read(text: string) {
            return `Me: ${text}`;
        }
    },
    // function
    greet(name: string) {
        return `Hello, ${name}! I'm ${this.name}.`;
    }
}

const SObjectTests = Tester.of({
    playground: function() {
        const a = SObject.of(2);
        a.value = 4;
    },
    testTry: function() {
        const a1 = new SObject(1);

        a1.set(4);
        a1.fetch(value => console.assert(value === 4));
        
        const a2 = SObject.of([10, 20, "ok", new Date()]);
        a2.tryGet([0], value => console.assert(value === 10));
        a2.trySet(["length"], 0);
        a2.tryGet(["value"], arr => console.assert(arr.length === 0))

        const so1 = SObject.of(complexObject);
        so1.tryCall(["behavior", "read"], ["Hello"], value => {
            console.assert(value === "Me: Hello");
        });
        
        so1.tryCall(["tryCall"], [["behavior", "read"], ["Hello"], (value: string) => {
            console.assert(value === "Me: Hello")
        }]);

        SObject.of((text: string) => text)
        .tryCall("value", ["tryCall1"], res => 
            console.assert(res === "tryCall1")
        );
    },

    testCall() {
        SObject.of((text: string) => text)
        .assert(self => self.call(["call1"]) === "call1");

        const sof = SObject.of((a: number, b: number) => a + b );
        sof.assert(self => self.call([2, 3]) === 5);
        sof.assert(self => self(2, 3) === 5);
    },

    testInvoke() {
        SObject.of(complexObject)
        .assert(self => self.invoker(["greet"], ["zhiyuan"])() === "Hello, zhiyuan! I'm Daniel Han.")
    },

    testTraverse() {
        let concated: any[] = [];
        SObject.of(complexObject)
        .traverse(attr => {
            attr.getAsInstance(Map, map => console.assert(map.size === 1));
            if (attr.objectFrom(Array)) {
                concated = concated.concat(attr.get());
            }
        });
        console.assert(concated.length === 7);
    },

    testInteract() {
        const o1 = SObject.of({count: 2, text: "o1 text"});
        const o2 = SObject.of({count: 3, text: "o2 Text"});
        SObject.act(o1, o2, (a1, a2) => {
            a1.set(a1.get() + a2.get());
            return true;
        });
        o1.assert(self => self.count === 5);
        SObject.act("123", "45" ,(o1, o2) => {
            console.assert(o1.get() + o2.get() === "12345");
            return true;
        });

        const o3 = SObject.of({
            a: {b: 3},
            c: {
                d: "haha",
                e: {
                    hello: ()=>{}
                }
            },
            booleanValue: true,
            value: 10
        });
        
        SObject.of(3).interact(2, (a1, a2) => {
            a1.set(a1.get() + a2.get());
        }).assert(self => self.value === 5);
        
        
        o3.interact(10, (a1, a2) => {
            a1.set(a1.get() * a2.get());
        }).assert(self => self.value === 100);


        // ADD SUB MULT
        SObject.of({a: 1, b: 10}).add({b: 32}).sub({a: 2}).mult(3)
        .assert(self => self.a === -1 && self.b === 42);

        SObject.of(2).set(10).add(3).add(10).sub(3).mult(0.5)
        .assert(self => self.value.toString() === "10");

        SObject.of({ pos: {x: 2, y:3 }, vel: {x: 10, y: 6} }).add({
            pos: {x: 3, y: 2},
            vel: {x: 1, y: 10}
        }).assert(self => self.deepEqual({
            pos: {x: 5, y: 5}, vel: {x: 11, y: 16}
        })).sub({vel: {x: 7, y: 10}})
        .assert(self => self.deepEqual({
            pos: {x: 5, y: 5}, vel: {x: 4, y: 6}
        })).mult({pos: {x: 2, y: 0}})
        .assert(self => self.deepEqual({
            pos: {x: 10, y: 0}, vel: {x: 4, y: 6}
        }));

    },
    
    testClone: function() {
        SObject.of(123).assert(self => self.clone().value === 123);

        const same = {a: 2, b: 11, c: 123};
        SObject.of({a: 2, b: 11, c: 123})
        .assert(self => self.clone().equals(same));

        const cloned = SObject.of(complexObject).clone();
        cloned.attr(["coordinates", 0]).assert(self => self.get() === 32.7157);
        cloned.attr("coordinates.1").get()
        console.assert(cloned.subset(["profile"]).has("score") === false);
        console.assert(cloned.extract("profile", "social", "github") === "https://github.com/Bangbiu");
        cloned.traverse((attr) => {
            const value = attr.get();
            if(value instanceof Map)
                console.assert(value.size === 1);
        });
    },

    testAccessSetFetchSetIn: function() {
        const a1 = new SObject(1);
        a1.access([], attr => attr.set(5))
        a1.assert(self => self.value === 5);

        a1.set(7);
        a1.fetch(value => console.assert(value === 7));

        a1.setIn("", 9);
        a1.assert(self => self.getFrom("") === 9)
        
        a1.set(10);
        a1.assert(self => self.get() === 10);

        SObject.of({count: 2}).mult({count: 4})
        .assert(self => self.count === 8);

        new SObject([123]).access("value.0", attr => attr.set(321))
        .assert(self => self.get() === 321);

        const a2 = SObject.of(complexObject);
        a2.set(2)
        .assert(self => self.get() === 2);
    },

    testMetaAndRaw: function() {
        const so = SObject.of({ a: 1, b: 2 });
        // instance getters: class, valueType, keys, raw, toString
        so.assert(self => self.className === "SObject");
        so.assert(self => self.valueType === "undefined");

        const ks = (so as any).keys as string[];
        console.assert(Array.isArray(ks) && ks.includes("a"));

        console.assert(so.raw() === so);
        console.assert(typeof so.toString() === "string");
    },

    testSetUpdateInsertInitializeCopyAssign: function() {
        const so = SObject.of({ a: 1, b: 2 });

        // instance setValues / updateValues / insertValues
        so.setValues({ a: 10, c: 3 });
        so.assert(self => self.a === 10 && self.getFrom("c") === 3);

        so.updateValues({ a: 20, d: 999 } as any);
        so.assert(self => self.a === 20 && self.getFrom("c") === 3 && !("d" in self));

        so.insertValues({ a: 99, e: 5 } as any);
        so.assert(self => self.a === 20 && self.getFrom("e") === 5);

        // static initialize
        const initTarget = { a: 0, b: 0 };
        SObject.initialize(initTarget, { a: 5 }, { a: 1, b: 2 });
        console.assert(initTarget.a === 5 && initTarget.b === 2);

        // static assign + copy
        const copyTarget = SObject.of({ obj: { x: 1 } });
        const src = { obj: { x: 42 } };
        SObject.copy(copyTarget, src);
        copyTarget.assert(self => self.obj.x === 42);

        // ensure assign works with DATA_IDEN path through instance.assign
        copyTarget.assign("extra", 123);
        copyTarget.assert(self => self.getFrom("extra") === 123);
    },

    testHasHasAllAndStaticHas: function() {
        const so = SObject.of({ a: 1, b: 2 }) as any;

        console.assert(so.has("a") === true);
        console.assert(so.has("c") === false);

        console.assert(so.hasAll(["a", "b"]) === true);
        console.assert(so.hasAll(["a", "c"]) === false);

        console.assert(SObject.hasAll(so, ["a"]) === true);
        console.assert(SObject.hasKey(so, "a") === true);
        console.assert(SObject.hasKey(so, "nope") === false);
    },

    testResolveAndResolveAll: function() {
        // instance resolve
        const so = SObject.of({ nested: { v: 1 } });
        so.resolve("nested", SObject as any);
        so.assert(self => self.nested instanceof SObject);

        // static resolve
        const holder: any = { nested: { v: 2 } };
        SObject.resolve(holder, "nested", SObject as any);
        console.assert(holder.nested instanceof SObject);

        // resolveAll (currently identity)
        const same = so.resolveAll();
        console.assert(same === so);
    },

    testAttrAndAttributionAlias: function() {
        const so = SObject.of({ a: { b: 3 } });

        const attr1 = so.attr(["a", "b"]);
        const attr2 = so.attribution(["a", "b"]);
        console.assert(attr1.get() === 3);
        console.assert(attr2.get() === 3);
    },

    testSubsetStaticAndExtract: function() {
        const so = SObject.of({
            a: 1,
            b: 2,
            c: 3,
            nested: { x: 10, y: 20 }
        });

        const part = SObject.subset(so, ["a", "c"]);
        console.assert(part.a === 1 && part.c === 3 && (part as any).b === undefined);

        so.assert(self => self.extract("nested", "x") === 10)
    },

    testGetterSetterCallerPrinterMsgDebugAssert: function() {
        const so = SObject.of({
            value: 10,
            mul: function (x: number) { return x * 2; }
        });

        // getter / setter helpers
        const getValue = so.getter("value");
        const setValue = so.setter("value") as (v: number) => any;
        console.assert(getValue() === 10);
        setValue(20);
        console.assert(getValue() === 20);

        // invoker / caller
        const inv = so.invoker("mul", [3]);
        console.assert(inv() === 6);

        const funcObj = SObject.of((x: number, y: number) => x * y);
        const bound = funcObj.caller([2, 5]);
        console.assert(bound() === 10);

        // print / printer / msg / msgr / debug / assert
        // so.print();
        // so.print("value");
        // so.msg();
        // so.msg("value");

        // const p = so.printer("value");
        // p();
        // const m = so.msgr("value");
        // m();

        // so.debug();
        so.assert(self => self.value === 20);
    },

    testEqualsAndDeepEqualStaticAndInstance: function() {
        // static equals / deepEqual on plain objects
        const o1 = { a: 1, b: 2 };
        const o2 = { a: 1, b: 2 };
        const o3 = { a: 1, b: 3 };

        console.assert(SObject.equals(o1, o2));
        console.assert(!SObject.equals(o1, o3));
        console.assert(SObject.deepEqual(o1, o2));
        console.assert(!SObject.deepEqual(o1, o3));

        // maps / sets / arrays through deepEqual
        const m1 = new Map([["k", 1]]);
        const m2 = new Map([["k", 1]]);
        const s1 = new Set([1, 2, 3]);
        const s2 = new Set([1, 2, 3]);
        const arr1 = [1, { x: 2 }];
        const arr2 = [1, { x: 2 }];

        console.assert(SObject.deepEqual(m1, m2));
        console.assert(SObject.deepEqual(s1, s2));
        console.assert(SObject.deepEqual(arr1, arr2));
        console.assert(!SObject.deepEqual(arr1, [1, { x: 3 }]));

        // instance equals / deepEqual
        const so1 = SObject.of({ a: 1, b: [1, 2] });
        const so2 = SObject.of({ a: 1, b: [1, 2] });

        so1.assert(self => !self.equals(so2));  // shallow array ref diff
        so1.assert(self => self.deepEqual(so2)); // deepEqual succeeds
    },

    testResolveKeyPathAndGetAttrInternalHelpers: function() {
        const so = SObject.of({ a: { b: 3 } }) as any;

        // resolveKeyPath + getAttr
        const path = SObject.resolveKeyPath<any>("a.b") as any;
        console.assert(Array.isArray(path) && path[0] === "a");

        const attr = SObject.getAttr(so, "a.b" as any);
        console.assert(attr.get() === 3);

        const attr2 = SObject.getAttribution(so, ["a", "b"] as any);
        console.assert(attr2.get() === 3);
    },

    testStaticSetInGetFromInvokeTryAccessOnPlainObject: function() {
        const obj = {
            x: 1,
            y: 2,
            add(dx: number, dy: number) {
                this.x += dx;
                this.y += dy;
                return this.x + this.y;
            }
        };

        // static setIn / getFrom
        SObject.setIn(obj, "x", 10);
        console.assert(SObject.getFrom(obj, "x") === 10);

        // static invoke
        // (10 + 1) + (2 + 2) = 11 + 4 = 15
        const sum = SObject.invoke(obj, ["add"], [1, 2]);
        console.assert(sum === 15);

        // static tryGet / trySet / tryCall / access
        SObject.tryGet(obj, "x", v => console.assert(v === 11));
        SObject.trySet(obj, "y", 20, v => console.assert(v === 20));
        // (11 + 1) + (20 + 1) = 12 + 21 = 33
        SObject.tryCall(obj, "add", [1, 1], v => console.assert(v === 33));
        SObject.access(obj, "x", attr => {
            console.assert(attr.get() === 12);
        });
    }
});

export {
    SObjectTests
}