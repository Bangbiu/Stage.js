import { SObject } from "../utils/SObject.js";


type MethodKeys<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

class Tester extends SObject {
    private constructor(properties: Record<PropertyKey, Function>) {    
        super(properties);
    }

    testAll() {
        this.traverse(test => test.getAsType("function", f => f()));
    }
    
    static of<T extends Record<PropertyKey, Function>>(properties: T): Tester & T {
        return new Tester(properties) as Tester & T;
    }

    static statvar = 1;
}

export {
    Tester
}