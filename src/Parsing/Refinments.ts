import {Atomic, Atomics, BinOps} from "../Propositions/connectives";
import {pipe} from "fp-ts/function";
import * as ROA from "fp-ts/ReadonlyArray";
import * as REF from "fp-ts/Refinement";

import {CompoundWFF, NegatedWFF, ParserError, SingleParserError, WFF} from "./Types";
import {isWhiteSpace} from "../utils";
import {BinOperation} from "../Propositions/Types";

export const isBinOperation = (s: string): s is BinOperation => {
    return pipe(BinOps as ReadonlyArray<string>, ROA.reduce(false, (found, op) => found || op == s))
}
export const isArrayParserError = (e: ParserError): e is ReadonlyArray<ParserError> => Array.isArray(e)
export const isSingleParserError = (e: ParserError): e is SingleParserError => !Array.isArray(e)
export const isString = (s: unknown): s is string => typeof s == 'string'
export const isArray = (s: unknown): s is Array<unknown> => Array.isArray(s)
//export const ruleOutString = (k: string | WFF): k is WFF => !isString(k) || Atomics.includes(k as Atomic)
export const isStringOrArray = (s: unknown) => pipe(isString, REF.or(isArray))
export const isExpected = <S extends string>(s: S) => (str: string): str is S => str === s

export const liftTupFst = <L1, R, L2 extends L1>(rf: (l: L1) => l is L2) => {
    return (tp: [L1, R]): tp is [L2, R] => rf(tp[0])
}
export const filterEmpty = <T>(v: string | T): v is T => !isString(v) || !isWhiteSpace(v)
export const isSingleton = <T>(ts: ReadonlyArray<T>): ts is readonly [T] => ts.length == 1
export const isAtomic = (s: string): s is Atomic =>
    s.length == 1
    && pipe(Atomics, ROA.reduce(false, (found, ch) => found || ch == s)
)

export const isNegatedWFF = (ts: ReadonlyArray<unknown>): ts is NegatedWFF => {
    return ts.length == 2
        && ts[0] == '~'
        && (isString(ts[1]) || isArray(ts[1])) && isWff(ts[1])
}
    // ['(', WFF, BinOperation, WFF, ')']
export const isCompoundWFF = (wffRef: REF.Refinement<string | ReadonlyArray<unknown>, WFF>) => (ts: ReadonlyArray<unknown>): ts is CompoundWFF => {
    return ts.length == 5
        && ts[0] == '('
        && pipe(isString, REF.or(isArray))(ts[1]) && wffRef(ts[1])
        && isString(ts[2]) && isBinOperation(ts[2])
        && (isString(ts[3]) || isArray(ts[3])) && wffRef(ts[3])
        && ts[4] == ')'
}

export const isWff = (ts: string | ReadonlyArray<unknown>): ts is WFF => {
    return (isString(ts) && isAtomic(ts))
        || !isString(ts) && (isNegatedWFF(ts) || isCompoundWFF(isWff)(ts))
}

