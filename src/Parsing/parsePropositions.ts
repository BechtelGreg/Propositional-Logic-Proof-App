import * as E from "fp-ts/Either"
import * as O from "fp-ts/Option"
import * as Tup from "fp-ts/ReadonlyTuple"
import * as M from "fp-ts/Map"
import * as ROA from "fp-ts/ReadonlyArray"
import * as S from 'fp-ts/string'
import {flow, identity, LazyArg, pipe} from "fp-ts/function";
import {Monoid} from "fp-ts/Monoid";
import {
    Atomic,
    Atomics,
    BinOps,
    makeConjunction,
    makeDisjunction,
    makeEquivalence,
    makeImplication,
    makeNegation,
    Proposition
} from "../Propositions/connectives";
import * as Refinements from "./Refinments";
import {CompoundWFF, Input, NegatedWFF, Parser, ParserError, SingleParserError, WFF} from "./Types";
import {BinOperation} from "../Propositions/Types";
import {Abbreviations, abbrevToDedRule, DeductionRules, deductionRules} from "../DeductionRules/rulesOfInference";
import * as PRED from "fp-ts/Predicate";
import {ErrorMessage} from "../validation/errorstuff";
import {pairRO} from "../utils";


export const map: <T, U>(f: (t: T) => U) => (fa: Parser<T>) => Parser<U>
    = f => fa => flow(fa, E.map(Tup.mapFst(f)))

export const flatmap: <T, U>(f: (t: T) => Parser<U>) => (pt: Parser<T>) => Parser<U>
    = f => pt => flow(pipe(pt, map(f)), E.chain(([pu, i]) => pu(i)))

const refine = <T, U extends T>(pr: (t: T) => t is U, errorMessage: (t: T) => string): (p: Parser<T>) => Parser<U> => {
    const pred = (tup: readonly [T, Input]): tup is readonly [U, Input] => pr(tup[0])
    const onFalse = ([t, i]: readonly [T, Input]): ParserError => makeParserError(errorMessage(t), i);

    return p => flow(p, E.chain(E.fromPredicate(pred, onFalse)))
}

export const makeInput = (string: string, position?: number): Input => ({
    string,
    position: position ? Math.trunc(position) : 0
})

const inputConsumed = (i: Input): boolean => i.position == i.string.length;

const makeParserError = (error: string, input: Input): SingleParserError => ({
    error,
    position: input.position
})

const index = <T>(a: ReadonlyArray<T>) => ROA.zip(a)(ROA.makeBy(a.length, identity));

const makeWffParserError = (i: Input): SingleParserError => {
    const error = `'${i.string}' is Not a WFF {'${
        pipe(i.string,
            toCharArray,
            index,
            ROA.map(k => `(${k[0]}, '${k[1]}')`)
        )
    }'}`
    return {
        error,
        position: i.position
    }
}

const advance: (input: Input) => O.Option<[string, Input]>
    = input => input.position < input.string.length
    ? O.some([
        input.string[input.position],
        makeInput(input.string, input.position + 1)
    ])
    : O.none

const allowWhiteSpace = <T>(p: Parser<T>): Parser<T> => {
    const notSingletonMssg = (ts: ReadonlyArray<T>) => `length of (${JSON.stringify(ts)}) greater than 1`
    return pipe(
        sequence<string | T>(possParseEmpty, p, possParseEmpty),
        map(ROA.filter(Refinements.filterEmpty)),
        refine(Refinements.isSingleton, notSingletonMssg),
        map(([t]) => t)
    )
}
export const parseChar: <Stype extends string>(expectedChar: Stype) => Parser<Stype>
    = expectedChar => input =>
    pipe(input,
        advance,
        E.fromOption(() => makeParserError('Unexpected end of Input', input)),
        E.chain(E.fromPredicate(
            Refinements.liftTupFst(Refinements.isExpected(expectedChar)),
            ([char, input]) => makeParserError(`char '${char}' != expectedChar '${expectedChar}'`, input)
        ))
    )


export const showParserError = (e: ParserError): string => {
    return Refinements.isSingleParserError(e)
        ? `left((${e.error}) at ${e.position})`
        : pipe(e, ROA.map(showParserError), ROA.getShow(S.Show).show);
}

const showParsedResult = <T>([t, rest]: readonly [T, Input]): string =>
    `right((${JSON.stringify(t)}: ${
        Refinements.isArray(t)
            ? 'Array'
            : typeof t
    }), ${JSON.stringify(rest)})`

const showParserResult: <T>(r: ReturnType<Parser<T>>) => string
    = E.fold(showParserError, showParsedResult)

export const product: <A, B>(fa: Parser<A>, fb: Parser<B>) => Parser<readonly [A, B]>
    = (fa, fb) =>
    flow(fa,
        E.chain(([a, inputAfterA]) =>
            pipe(fb(inputAfterA),
                E.map(Tup.mapFst(pairRO(a)))
            )
        )
    )

export const success: <A>(a: A) => Parser<A>
    = a => flow(pairRO(a), E.right)

export const sequence = <A>(...fas: ReadonlyArray<Parser<A>>): Parser<ReadonlyArray<A>> => {
    const appendParser = (arrayParser: Parser<ReadonlyArray<A>>, pa: Parser<A>): Parser<ReadonlyArray<A>> =>
        pipe(product(arrayParser, pa), map(([result, a]) => ROA.append(a)(result)))

    return pipe(fas, ROA.reduce(success([]), appendParser))
}

export const sequenceArr: <A>(fas: ReadonlyArray<Parser<A>>) => Parser<ReadonlyArray<A>>
    = arr => sequence(...arr)


const toCharArray = (s: string): ReadonlyArray<string> => ROA.fromArray([...s])
const parseChars: (s: string) => Parser<ReadonlyArray<string>>
    = flow(toCharArray, ROA.map(parseChar), sequenceArr)

export const parseStr: (s: string) => Parser<string>
    = flow(parseChars, map(ROA.reduce(S.Monoid.empty, S.Monoid.concat)))

export const failParser = (message: string): Parser<never> => input => E.left(makeParserError(message, input))

export const oneOf = <T>(...pas: ReadonlyArray<LazyArg<Parser<T>>>): Parser<T> => oneOfArr(pas)

const combineErrors = (e1: ParserError) => (e2: ParserError): ParserError => {
    if (Refinements.isArrayParserError(e1)) {
        return ROA.append(e2)(e1)
    }
    if (Refinements.isArrayParserError(e2)) {
        return ROA.prepend<ParserError>(e1)(e2)
    }
    return ROA.fromArray([e1, e2])
}

const oneOfArr = <T>(pas: ReadonlyArray<LazyArg<Parser<T>>>): Parser<T> =>
    pipe(
        pas,
        ROA.foldLeft(
            () => failParser('None of parsers succeeded'),
            (head: () => Parser<T>, tail: ReadonlyArray<() => Parser<T>>) => input => pipe(
                head()(input),
                E.orElse(pe => pipe(oneOfArr(tail)(input), E.mapLeft(combineErrors(pe)))),
            )
        ),
    )

const many = <T>(pa: Parser<T>): Parser<ReadonlyArray<T>> => {
    return flow(pa,
        E.map(Tup.mapFst(ROA.of)),
        E.chain(([ts, input]) =>
            pipe(
                oneOf(() => many(pa), () => success<ReadonlyArray<T>>([]))(input),
                E.map(Tup.mapFst(somets => ts.concat(somets)))
            )
        )
    );
}

const reduceMany: <T>(m: Monoid<T>) => (pa: Parser<ReadonlyArray<T>>) => Parser<T>
    = m => flow(map(ROA.reduce(m.empty, m.concat)))


const parseEmpty = reduceMany(S.Monoid)(many(parseStr(' ')))

const parseAtomic: Parser<Atomic> = pipe(
    Atomics,
    ROA.map(c => () => pipe(parseChar(c), map(char => char as Atomic))),
    oneOfArr
)

const possibly = (pa: Parser<string>): Parser<string> => {
    return (input: Input) => pipe(pa(input), E.orElse(e => success('')(input)))
}

const possParseEmpty = possibly(parseEmpty)

const parseCharAllowingWS = <S extends string>(c: S) => allowWhiteSpace(parseChar(c))
const parseStringAllowingWS = (s: string) => allowWhiteSpace(parseStr(s))


function binOPpropParser(binOp: BinOperation): Parser<CompoundWFF> {
    type T = | '(' | string | WFF | ')'
    return pipe(sequence<T>(
            parseCharAllowingWS('('),
            parseWFF,
            parseStringAllowingWS(binOp),
            parseWFF,
            parseCharAllowingWS(')')
        ),
        refine(Refinements.isCompoundWFF(Refinements.isWff), ts => `${JSON.stringify(ts)} are misordered`)
    )
}

const parseDeductionRule = oneOfArr(
    pipe(deductionRules,
        ROA.map(s => () =>
            pipe(parseStringAllowingWS(s),
                map(s => s as DeductionRules)
            )
        ))
)

export const parseInteger = pipe(
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    ROA.fromArray,
    ROA.map(d => `${d}`),
    ROA.map(digch => () => parseCharAllowingWS(digch)),
    oneOfArr,
    many,
    map(ROA.reduce(S.Monoid.empty, S.Monoid.concat))
)

const f1: (s: string) => E.Either<ErrorMessage, Number>
    = flow(Number, E.fromPredicate(
        (n: number): n is number => PRED.not(isNaN)(n),
        s => `'${s}' is not a number`
    )
)

const f2 = flow(ROA.map(f1), E.sequenceArray);

export const parsePremiseNumbers = pipe(
    many(oneOf(
        () => parseInteger,
        () => parseCharAllowingWS(',')
    )),
    map(flow(ROA.filter(c => {
     //   console.log(c)
        return c != ','
    }), ROA.map(Number))),
)

export type ParsedDeduction = [Proposition, ',', DeductionRules, ReadonlyArray<number>]
const abrevParser: Parser<Abbreviations> = pipe(
    abbrevToDedRule,
    M.mapWithIndex((ab, r) => () => pipe(parseStr(ab), map(ab => ab as Abbreviations))),
    M.collect(S.Ord)((_, lazyParser) => lazyParser),
    oneOfArr
)


export const parseDeductionString = (s: string): E.Either<ParserError, ParsedDeduction> => {
    type T = Proposition | ',' | DeductionRules | ReadonlyArray<number>
    return pipe(
        makeInput(s),
        pipe(sequence<T>(
                parseProp,
                parseCharAllowingWS(','),
                oneOf(
                    () => parseDeductionRule,
                    () => pipe(abrevParser, map(ab => abbrevToDedRule.get(ab)!))
                ),
                parsePremiseNumbers,
            ),
            map(ts => ts as ParsedDeduction)
        ),
        E.chain(dropConsumedInput)
    )
}

export const compoundParser: LazyArg<Parser<CompoundWFF>>
    = () => oneOfArr(BinOps.map(op => () => binOPpropParser(op)))

export const unaryParser: LazyArg<Parser<NegatedWFF>>
    = () => pipe(
        sequence<'~' | WFF>(parseCharAllowingWS('~'), parseWFF),
        refine(Refinements.isNegatedWFF, ts => `${JSON.stringify(ts)} is misordered`)
    )
const atomicParser: LazyArg<Parser<Atomic>> = () => allowWhiteSpace<Atomic>(parseAtomic);
export const parseWFF = oneOf<WFF>(unaryParser, compoundParser, atomicParser)

const propConstructor = (op: BinOperation) => {
    switch (op) {
        case "v":
            return makeDisjunction
        case "*":
            return makeConjunction
        case "->":
            return makeImplication
        case "<->":
            return makeEquivalence
    }
}

export const toProposition = (wff: WFF): Proposition => {
    if (Refinements.isString(wff) && Refinements.isAtomic(wff)) {
        return wff
    }

    if (Refinements.isNegatedWFF(wff)) {
        return pipe(wff[1], toProposition, makeNegation)
    }

    return propConstructor(wff[2])(toProposition(wff[1]))(toProposition(wff[3]))
}

const dropConsumedInput: <T>(r: readonly [T, Input]) => E.Either<ParserError, T> = flow(
    E.fromPredicate(
        flow(Tup.snd, inputConsumed),
        flow(Tup.snd, makeWffParserError)
    ),
    E.map(Tup.fst)
)

const parseProp: Parser<Proposition> = flow(parseWFF, E.map(Tup.mapFst(toProposition)))

export const parse: (s: string) => E.Either<ParserError, Proposition>
    = flow(makeInput, parseProp, E.chain(dropConsumedInput))


