import { DATA_IDEN, RAW, SObject } from "../utils/SObject.js";

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

export default {
    test1: function() {
        const cloned = SObject.of(complexObject).clone();
        cloned.log();
        console.log(SObject.of(123));
        const addee = {a: 2, b: 11, c: 123};
        console.log(SObject.of({a: 1, b: 10}).add({b: 32}));
        console.log(SObject.of({a: 2, b: 11, c: 123}).equals(addee));
        console.log(cloned.attr(["coordinates", 0]).get())
        console.log(cloned.attr("coordinates.1").get());
        console.log(cloned.subset(["profile"]));
        console.log(cloned.chain("profile", "social", "github"));
        cloned.traverse((target, key) => {
            if(target[key] instanceof Map)
                console.log(target[key]);
        }, [], ["number", "boolean", "string", "object"]);
    },

    test2: function() {
        const a1 = new SObject(1);
        a1.access([], attr => attr.set(5))
        a1.assert(self => self.value === 5);

        a1.store(7);
        a1.fetch(value => console.assert(value === 7));

        a1.setIn("", 9);
        a1.assert(self => self.getFrom("") === 9)

        a1.trySet("", 4);
        a1.tryGet("", value => console.assert(value === 4));
        
        a1.set(10);
        a1.assert(self => self.get() === 10);

        SObject.of(2).add(3).sub(3).multiply(4).set(6)
        .assert(self => self.get() === 6);

        SObject.of({count: 2}).multiply({count: 4})
        .assert(self => self.count === 8);

        new SObject([123]).access("val.0", attr => attr.set(321))
        .assert(self => self.get() === 321);

        const a2 = SObject.of(complexObject);
        a2.store(2)
        .assert(self => self.get() === 2);

        const a3 = SObject.of(function add(a: number, b: number) { return a + b });
        a3.assert(self => self.call([2, 3]) === 5);
        a3.assert(self => self.get()(2, 3) === 5);
    },

    test3: function() {
        const so1 = SObject.of(complexObject);
        so1.assert(self => self.invoker(["greet"], ["zhiyuan"])() === "Hello, zhiyuan! I'm Daniel Han.")
        so1.tryCall(["behavior", "read"], ["Text"],
            returnValue => console.assert(returnValue === "Me: Text")
        )
    }
}