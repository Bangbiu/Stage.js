
import { Attribution } from "../utils/SObject.js";

export class Animation {
    static derive: (target: Attribution, deltaArr: any[]) => any;
    static toggle: (target: Attribution, seq: any[]) => any;
    static transition: (target: Attribution, stops: any[]) => any;
}

Animation.derive = function DeriveAnimation(target: Attribution, deltaArr: any[]): any {
    let deltaDpts = Attribution.attributize(deltaArr);
    return function () {
        target.add(deltaDpts[0].get());
        //target.set(target.get() + deltaDpts[0].get());
        for (let i = deltaArr.length - 1; i > 0; i--) {
            deltaDpts[i - 1].add(deltaDpts[i].get());
        }
    };
};

Animation.toggle = function ToggleAnimation(target: Attribution, seq: any[]): any {
    let index = 0;
    return function () {
        target.set(seq[index]);
        index = (index + 1) % seq.length;
    };
};

Animation.transition = function TransitionAnimation(target: Attribution, stops: any[]): any {
    return ()=>{};
};
