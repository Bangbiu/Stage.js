function* randomInt(cap1: number, cap2: number = 0, count: number = -1): Generator<[number, number], void, Voidable<boolean>> {
    const min = Math.min(cap1, cap2);
    const max = Math.max(cap1, cap2);
    let index = 0;
    while (true) {
        const ret = yield [Math.floor(Math.random() * (max - min + 1)) + min, index];
        if (ret === false) return;
        index++;
        if (index === count) return;
    }
}

function* range(cap1: number, cap2: number = 0, step: number = 1): Generator<number, void, void> {
    const min = Math.min(cap1, cap2);
    const max = Math.max(cap1, cap2);
    for (let num = min; num < max; num+= step){
        yield num;
    }
}

function* enumerate<T>(list: Array<T>): Generator<[T, number], void, void> {
    let index = 0
    for (const elem of list) {
        yield [elem, index];
        index++;
    }
}

export {
    randomInt,
    range,
    enumerate
}