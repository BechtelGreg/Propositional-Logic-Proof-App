import {Board, Deductions, Index, makeDeductionBy} from "../Types";
import {propIdentity} from "../../Propositions/Refinments";
import {flow, identity, pipe} from "fp-ts/function";
import * as E from 'fp-ts/Either'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as TUP from 'fp-ts/ReadonlyTuple'
import * as REF from "fp-ts/Refinement";
import * as ROA from "fp-ts/ReadonlyArray";
import {ErrorMessage} from "../../validation/errorstuff";
import {Proposition} from "../../Propositions/connectives";
import * as PRED from "fp-ts/Predicate";
import {deductionRules, DeductionRules, equivalenceRules, implRules} from "../../DeductionRules/rulesOfInference";
import {isDeductionRule} from "../../DeductionRules/Refinements";
import * as TE from "fp-ts/TaskEither";
import * as Parser from "../../Parsing/parsePropositions";


export const isSingleton = <T>(a: ReadonlyArray<T>): a is [T] => a.length == 1
export const isTwople = <T>(a: ReadonlyArray<T>): a is [T, T] => a.length == 2
export const isTriple = <T>(a: ReadonlyArray<T>): a is [T, T, T] => a.length == 3
export const isQuaduple = <T>(a: ReadonlyArray<T>): a is [T, T, T, T] => a.length == 4

export const solved = (b: Board): boolean => pipe(b.lines,
    RNEA.fromReadonlyArray,
    E.fromOption(() => false),
    E.map(flow(RNEA.unappend, TUP.snd, TUP.fst)),
    E.map(propIdentity(b.proofTarget)),
    E.fold(identity, identity)
)

export const allInRange: (b: Board) => REF.Refinement<ReadonlyArray<number>, ReadonlyArray<Index>>
    = b =>
    (arr: ReadonlyArray<number>): arr is ReadonlyArray<Index> => pipe(
        arr,
        ROA.reduce(
            true,
            (inRange: boolean, n: number) =>
                inRange && 0 <= n && n < b.lines.length
        )
    )

export const checkNonEmptyArray = E.fromPredicate(
    (
        a: ReadonlyArray<Proposition>
    ): a is RNEA.ReadonlyNonEmptyArray<Proposition> => a.length > 0,
    a => `${JSON.stringify(a)} somehow empty`);
export const checkDeductionRule: (rule: string) => E.Either<ErrorMessage, DeductionRules>
    = E.fromPredicate(
    isDeductionRule,
    unrule => `${unrule} is not a Deduction Rule: 
                        ${JSON.stringify(deductionRules)}`
)

const errToMessage = flow(E.toError, e => e.message);

export const checkTriple: (s: string) => E.Either<ErrorMessage, readonly [string, string, string]>
    = flow(s =>
        E.tryCatch(
            () => pipe(s.split(':'), ROA.fromArray, ROA.map(s => s.trim())),
            errToMessage
        ),
    E.chain(E.fromPredicate(
        isTriple,
        (arr) =>
            `${JSON.stringify(arr)} is malformed input`)
    )
)

export const checkPremises = (b: Board) => (
    nums: ReadonlyArray<number>
): E.Either<
    ErrorMessage,
    ReadonlyArray<readonly [Index, Proposition]>
> => pipe(nums,
    E.fromPredicate(
        allInRange(b),
        (nms) => `Some values of ${JSON.stringify(nms)}
                 not on the Board`
    ),
    E.map(ROA.map(
        indx => [indx, b.lines[indx][0]] as const
    ))
)


const toDeduction: (b: Board) => (pd: Parser.ParsedDeduction) => E.Either<ErrorMessage, Deductions>
    = b => ([p, _1, rule,  nums]) => pipe(
    E.Do,
    E.let('conclusion', () => p),
    E.let('_rule', () => rule),
    E.bind('premises', () => checkPremises(b)(nums))
)


export const stringToDeduction
    = (b: Board) => (s: string): TE.TaskEither<ErrorMessage, Deductions> => pipe(
    () => Parser.parseDeductionString(s),
    TE.fromIOEither,
    TE.mapLeft(Parser.showParserError),
    TE.chain(flow(toDeduction(b), TE.fromEither))
)