import { RAW, SObject } from "../utils/SObject.js";

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
    greet: (name: string) => string;
}

export default {
    test1: function() {
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

            // function
            greet(name: string) {
                return `Hello, ${name}! I'm ${this.name}.`;
            }
        }
        const cloned = SObject.of(complexObject).clone();
        cloned.log();
        console.log(SObject.of(123));
        const addee = {a: 2, b: 11, c: 123};
        console.log(SObject.of({a: 1, b: 10}).add({b: 32}));
        console.log(SObject.of({a: 2, b: 11, c: 123}).equals(addee));
        console.log(cloned.attribution(["coordinates", 0]).get())
        console.log(cloned.attribution("coordinates.1").get());
        console.log(cloned.subset(["profile"]));
        console.log(cloned.chain("profile", "social", "github"));
        cloned.traverse((target, key) => {
            if(target[key] instanceof Map)
                console.log(target[key]);
        }, [], ["number", "boolean", "string", "object"]);
    },

    test2: function() {
        const o1 = {
            greet(name: string) {
                return `Hello, ${name}!`;
            }
        }

        const a1 = new SObject(o1);
        a1.access(["greet"])
        new SObject(2).add(3).sub(3).multiply(4).set(6).log();
        const a = new SObject([123])
        console.log(new SObject([123]).access([0], attr => attr.set(321)).get());
        
    }
}