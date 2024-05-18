import * as P from './parsePropositions'
import {flatmap, makeInput} from './parsePropositions'
import * as E from 'fp-ts/Either'
import * as ROA from 'fp-ts/ReadonlyArray'
import {Input, ParserError} from "./Types";
import {isSingleParserError} from "./Refinments";
import {pipe} from "fp-ts/function";

function compareParserError(p1: ParserError, p2: ParserError): boolean {
    const single1 = isSingleParserError(p1)
    const single2 = isSingleParserError(p2)

    if (single1 && single2) {
        return p1.error === p2.error
            && p1.position === p2.position
    }
    if (!single1 && !single2) {
        return pipe(p1, ROA.zip(p2), ROA.every(([a, b]): boolean => {
            return compareParserError(a, b)
        }))
    }
    return false
}

const compareParserResults = ([s1, r1]: readonly [string, Input], [s2, r2]: readonly [string, Input]) => {
    return s1 == s2 && r1.string == r2.string && r1.position == r2.position
};

describe('Parsing', () => {
    const helloP = P.parseStr('Hello');
    const rightId = P.flatmap(P.parseStr)(P.success('Hello'))
    const leftId = P.flatmap(P.success)(P.parseStr('Hello'))
    const input = P.makeInput('Hello');

    const eq = E.getEq(
        {equals: compareParserError},
        {equals: compareParserResults},
    );

    it('is Left Identity', () => {
        expect(eq.equals(leftId(input), helloP(input))).toBe(true)
    })

    it('is Right Identity', () => {
        expect(eq.equals(rightId(input), helloP(input))).toBe(true)
    })

    it('is Associative', () => {
        const g = pipe(P.parseStr('Hello 10'), flatmap(s => {
            const [token, nstr] = s.split(' ')
            const number = Number(nstr);
            let tok = ''
            for (let i = 0; i < number; i++) {
                tok += token
            }
            return P.parseStr(tok)
        }));
        console.log(g(makeInput("Hello 10HelloHelloHelloHelloHelloHelloHelloHelloHelloHello")))
    })

})