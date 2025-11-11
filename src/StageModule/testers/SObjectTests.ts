import { ABORT, JTS_ALL } from "../StageCore.js";
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

export default Tester.of({
    playground: function() {
        const a = SObject.of(2);
        a.value = 4;
    },
    testTry: function() {
        const a1 = new SObject(1);

        a1.store(4);
        a1.fetch(value => console.assert(value === 4));
        
        const a2 = SObject.of([10, 20, "ok", new Date()]);
        a2.tryGet("0", value => console.assert(value === 10));
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

        const sof = SObject.of(function add(a: number, b: number) { return a + b });
        sof.assert(self => self.call([2, 3]) === 5);
        sof.assert(self => self(2, 3) === 5);
    },

    testinvoke() {
        SObject.of(complexObject)
        .assert(self => self.invoker(["greet"], ["zhiyuan"])() === "Hello, zhiyuan! I'm Daniel Han.")
    },

    testTraverse() {
        SObject.of(complexObject)
        .traverse((value, owner, key, path) => {
            //console.log(value);
            if (typeof value === "object") return false;
        }, JTS_ALL)
    },

    testInteract() {
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
        
        o3.interact(10, ["number"], (o1, o2, key, path) => {
            console.log(path);
            o1[key] += o2[key];
            console.log(o1);
            return true;
        });
    },
    
    test1: function() {
        SObject.of(123).assert(self => self.value === 123);

        SObject.of({a: 1, b: 10}).add({b: 32})
        .assert(self => self.a === 1 && self.b === 42);

        const same = {a: 2, b: 11, c: 123};
        SObject.of({a: 2, b: 11, c: 123})
        .assert(self => self.equals(same));

        const cloned = SObject.of(complexObject).clone();
        cloned.attr(["coordinates", 0]).assert(self => self.get() === 32.7157);
        cloned.attr("coordinates.1").get()
        // console.log();
        // console.log(cloned.subset(["profile"]));
        // console.log(cloned.extract("profile", "social", "github"));
        cloned.traverse((value) => {
            // if(value instanceof Map)
            //     console.log(value);
        }, ["number", "boolean", "string", "object"]);
    },

    test2: function() {
        const a1 = new SObject(1);
        a1.access([], attr => attr.set(5))
        a1.assert(self => self.value === 5);

        a1.store(7);
        a1.fetch(value => console.assert(value === 7));

        a1.setIn("", 9);
        a1.assert(self => self.getFrom("") === 9)
        
        a1.set(10);
        a1.assert(self => self.get() === 10);

        SObject.of(2).add(3).sub(3).multiply(4).set(6)
        .assert(self => self.value === 6);

        SObject.of({count: 2}).multiply({count: 4})
        .assert(self => self.count === 8);

        new SObject([123]).access("val.0", attr => attr.set(321))
        .assert(self => self.get() === 321);

        const a2 = SObject.of(complexObject);
        a2.store(2)
        .assert(self => self.get() === 2);
    },

    test4: function() {
        const o1 = SObject.of({count: 2, text: "o1 text"});
        const o2 = SObject.of({count: 3, text: "o2 Text"});
        SObject.act(o1, o2, ["number", "string"], (o1, o2, key) => {
            const v1 = o1[key]
            const v2 = o2[key];
            o1[key] = v1 + v2;
            return true;
        });
        o1.assert(self => self.count === 5);
        SObject.act("123", "45", ["number"] ,(o1, o2) => {
            console.assert(o1.value + o2.value === "12345");
            return true;
        });
    }
});