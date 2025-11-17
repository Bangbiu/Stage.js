import { SObject } from "../utils/SObject.js";
import type AttributionTests from "./AttributionTests.js";
import type SObjectTests from "./SObjectTests.js";

class Tester extends SObject {
    private constructor(properties: Record<PropertyKey, Function>) {    
        super(properties);
    }

    testAll() {
        this.traverse(test => {
            test.getAsType("function", f => f())
        });
    }
    
    static of<T extends Record<PropertyKey, Function>>(properties: T): Tester & T {
        return new Tester(properties) as Tester & T;
    }

    static runAll() {
        SObject.traverse(Tester, 
            attr => attr.getAsInstance(Tester, 
                tester => tester.testAll()
            )
        )
    }

    static AttributionTests: typeof AttributionTests;
    static SObjectTests: typeof SObjectTests;
}

export {
    Tester
}