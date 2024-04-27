import {combineDeductionErrors} from "./Board";

describe('Board', () => {
    it('Should return the correct values', () => {
        const s = combineDeductionErrors(['SomeError1', 'SomeError2', 'SomeError3']);
        console.log(s)
    })
})