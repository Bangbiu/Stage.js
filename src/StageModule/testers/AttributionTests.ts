import { Attribution, SObject } from "../utils/SObject.js";
import { Tester } from "./Tester.js";
export default Tester.of({
    test1: function() {
        const o1 = { value: 4 };
        const o2 = { value: 6 };
        const o3 = { count: 10 };
        const o4 = { base: 10,
            adder: function(a: number, b: number) {
                return a + b + this.base;
            }
        };
        const a1 = Attribution.of(o1);
        const a2 = Attribution.of(o2); 
        const a3 = Attribution.of(o3, "count");
        const a4 = Attribution.of(o4, "adder");
        const a5 = Attribution.of("sample");

        console.assert(a1.add(1).get() === 5); 
        console.assert(a2.do(a1, (a, v, o) => a.set(v + o)).get() === 11);
        console.assert(a3.calc(v => v * v) === 100);
        console.assert(a4.call([3, 4], {base: 50}) === 57);
        o4.base = 0;
        console.assert(a4.caller([9, 6])() === 15);
        //console.assert(a5.do(input => input + ": tested").get() === "sample: tested");
        console.assert(Attribution.of(8).mult(3).add(-5).sub(6).get() === 13);
    },

    test2: function() {
        const o1 = {
            info: { summary: "_______"}
        }

        Attribution.of(o1.info, "summary").set("new")
        .assert(self => self.get() === "new");

    }
});