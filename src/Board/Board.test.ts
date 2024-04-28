import {combineDeductionErrors} from "./Board";
import {pipe} from "fp-ts/function";
import * as ROA from "fp-ts/ReadonlyArray";
import * as S from "fp-ts/string";

describe('Board', () => {
    it('Should return the correct values', () => {
        const s = combineDeductionErrors(['SomeError1', 'SomeError2', 'SomeError3']);
        console.log(s)
    })

    it('Should return the correct values', () => {
        const nl = ` 
`
        const ss = ['a', 'b', 'c'] as const
        pipe(ss, ROA.intercalate(S.Monoid)(nl), console.log)
    })
})