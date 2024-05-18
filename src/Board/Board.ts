import {flow, pipe} from "fp-ts/function";
import * as ROA from 'fp-ts/ReadonlyArray'
import * as E from 'fp-ts/Either'
import * as TUP from 'fp-ts/ReadonlyTuple'
import * as ROTUP from 'fp-ts/ReadonlyTuple'
import * as O from 'fp-ts/Option'
import {Parameters, Params} from "../DeductionRules/rulesOfInference";
import {Proposition, ShowProp} from "../Propositions/connectives";
import {Board, Deduction, Deductions, Index, permuteDeduction, ProofLine} from "./Types";
import {ErrorMessage} from "../validation/errorstuff";
import {validateParameter, ValidInferenceEvent} from "../validation/validation";
import {checkNonEmptyArray, isSingleton, isTriple, isTwople} from "./MappingRefinment/Refinments";
import * as PRef from "../Propositions/Refinments";
import {ParserError} from "../Parsing/Types";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";

export type EmptyArrayMessage = ReturnType<typeof emptyArrayMessage>


const emptyArrayMessage = () =>
    "Cannot construct board from empty array" as const


const pairToBoard: (pair: readonly [ReadonlyArray<ProofLine>, Proposition]) => Board
    = ([lines, proofTarget]) => ({lines, proofTarget})


const toLineDiscr = <r, l, c>({_rule, lineNumbers, conclusion}: { _rule: r, lineNumbers: l, conclusion: c }) =>
    [conclusion, {_rule, lines: lineNumbers}] as const

const toLine: (v: ValidInferenceEvent) => ProofLine
    = v => {
    switch (v._rule) {
        case "Addition":
            return toLineDiscr(v)
        case "Simplification":
            return toLineDiscr(v)
        case "Conjunction":
            return toLineDiscr(v)
        case "Modus Tollens":
            return toLineDiscr(v)
        case "Modus Ponens":
            return toLineDiscr(v)
        case "Constructive Dilemma":
            return toLineDiscr(v)
        case "Disjunctive Syllogism":
            return toLineDiscr(v)
        case "Hypothetical Syllogism":
            return toLineDiscr(v)
        case "Redundancy":
        case "Material Implication":
        case "Material Equivalence":
        case "Exportation":
        case "DoubleNegation":
        case "Distribution":
        case "DeMorgans":
        case "Contraposition":
        case "Commutation":
        case "Association":
            return toLineDiscr(v)
    }
}
export const append = (line: ProofLine) => (b: Board): Board =>
    pipe([pipe(b.lines, ROA.append(line)), b.proofTarget], pairToBoard)


const showPrems = (prems: ReadonlyArray<readonly [number, Proposition]>): string => pipe(
    prems,
    ROA.map(TUP.mapSnd(ShowProp)),
    JSON.stringify
)

const notSingletonError = (moreThanOne: ReadonlyArray<readonly [Index, Proposition]>) =>
    `Addition applies to a single premise, but 
        ${showPrems(moreThanOne)} is not a singleton`

const notTwopleError = (notTwo: ReadonlyArray<readonly [Index, Proposition]>) =>
    `Addition applies to a pair of premises, but 
        ${showPrems(notTwo)} is not a 2 tuple`

const notTripleError = (notThree: ReadonlyArray<readonly [Index, Proposition]>) =>
    `Addition applies to a pair of premises, but 
        ${showPrems(notThree)} is not a 3 tuple`
const prepareAdditionParams: (d: Deduction<'Addition'>) => E.Either<ErrorMessage, Params<'Addition'>>
    = ({premises, conclusion, _rule}) => {
    return pipe(premises,
        E.fromPredicate(isSingleton, notSingletonError),
        E.map(k => k[0]),
        E.map(([idx, p]) => ({_rule, p, conclusion, lineNumbers: [idx]})),
    )
}
const prepareConjunctionParams: (d: Deduction<'Conjunction'>) => E.Either<ErrorMessage, Params<'Conjunction'>>
    = ({_rule, premises, conclusion}) => {
    return pipe(premises,
        E.fromPredicate(isTwople, notTwopleError),
        E.map(([[idx1, p], [idx2, q]]) =>
            ({_rule, p, q, conclusion, lineNumbers: [idx1, idx2]})
        )
    )
}
const prepareConDilemmaParams: (d: Deduction<'Constructive Dilemma'>) => E.Either<ErrorMessage, Params<'Constructive Dilemma'>>
    = ({_rule, premises, conclusion}) => {
    return pipe(premises,
        E.fromPredicate(isTriple, notTripleError),
        E.map(([
                   [idx1, p1],
                   [idx2, p2],
                   [idx3, p3]
               ]) =>
            ({
                _rule,
                disjunctionOfAntecedents: p1,
                firstConditional: p2,
                secondConditional: p3,
                conclusion,
                lineNumbers: [idx1, idx2, idx3]
            })
        )
    )
}

const prepareDisSylParams: (d: Deduction<'Disjunctive Syllogism'>) => E.Either<ErrorMessage, Params<'Disjunctive Syllogism'>>
    = ({_rule, premises, conclusion}) => {
    return pipe(premises,
        E.fromPredicate(isTwople, notTwopleError),
        E.map(([[idx1, p1], [idx2, p2]]) =>
            ({
                _rule,
                possibleDisjunction: p1,
                possibleNegatedDisjunct: p2,
                conclusion,
                lineNumbers: [idx1, idx2]
            })
        )
    )
}
const prepareMPonParams: (d: Deduction<'Modus Ponens'>) => E.Either<ErrorMessage, Params<'Modus Ponens'>>
    = ({_rule, premises, conclusion}) => {
    return pipe(premises,
        E.fromPredicate(isTwople, notTwopleError),
        E.map(([[idx1, p1], [idx2, p2]]) => ({
                _rule,
                proposition: p1,
                implication: p2,
                conclusion,
                lineNumbers: [idx1, idx2]
            })
        )
    )
}

const prepareMTolParams: (d: Deduction<'Modus Tollens'>) => E.Either<ErrorMessage, Params<'Modus Tollens'>>
    = ({_rule, premises, conclusion}) => {
    return pipe(premises,
        E.fromPredicate(isTwople, notTwopleError),
        E.map(([[idx1, p1], [idx2, p2]]) => ({
                _rule,
                negation: p1,
                implication: p2,
                conclusion,
                lineNumbers: [idx1, idx2]
            })
        )
    )
}

const prepareSimpParams: (d: Deduction<'Simplification'>) => E.Either<ErrorMessage, Params<'Simplification'>>
    = ({_rule, premises, conclusion}) => {
    return pipe(premises,
        E.fromPredicate(isSingleton, notSingletonError),
        E.map(([[idx1, conjunction]]) => ({
                _rule,
                conjunction,
                conclusion,
                lineNumbers: [idx1]
            })
        )
    )
}

const prepareHypSylParams: (d: Deduction<'Hypothetical Syllogism'>) => E.Either<ErrorMessage, Params<'Hypothetical Syllogism'>>
    = ({_rule, premises, conclusion}) => {
    return pipe(premises,
        E.fromPredicate(isTwople, notTwopleError),
        E.map(([
                   [idx1, p1],
                   [idx2, p2]
               ]) => ({
                _rule,
                firstConditional: p1,
                secondConditional: p2,
                conclusion,
                lineNumbers: [idx1, idx2]
            })
        )
    )
}

const components = (p: Proposition): ReadonlyArray<Proposition> => {
    if (PRef.propIsAtomic(p)) {
        return [p]
    } else if (PRef.isUnaryCompound(p)) {
        return [p, p.prop]
    }
    return [...components(p.leftOperand), p, ...components(p.rightOperand)]
}

const prepareParams: (d: Deductions) => E.Either<ErrorMessage, Parameters>
    = d => {
    switch (d._rule) {
        case "Addition":
            return prepareAdditionParams(d)
        case "Conjunction":
            return prepareConjunctionParams(d)
        case "Constructive Dilemma":
            return prepareConDilemmaParams(d)
        case "Disjunctive Syllogism":
            return prepareDisSylParams(d)
        case "Modus Ponens":
            return prepareMPonParams(d)
        case "Modus Tollens":
            return prepareMTolParams(d)
        case "Simplification":
            return prepareSimpParams(d)
        case "Hypothetical Syllogism":
            return prepareHypSylParams(d)

        case "Association":
        case "Commutation":
        case "Contraposition":
        case "DeMorgans":
        case "Distribution":
        case "DoubleNegation":
        case "Exportation":
        case "Material Equivalence":
        case "Material Implication":
        case "Redundancy":
            const {premises, _rule, conclusion } = d
            return pipe(premises,
                E.fromPredicate(isSingleton, notSingletonError),
                E.map(([[idx, p]]) => ({
                        lineNumbers: [idx] as [Index],
                        conclusion,
                        ps: components(p),
                        _rule
                    })
                ))
    }
}

const evaluateDeduction: (d: Deductions) => E.Either<ErrorMessage, ProofLine>
    = flow(prepareParams, E.chain(validateParameter), E.map(toLine))




export const combineDeductionErrors = (errs: ReadonlyArray<ErrorMessage>): ErrorMessage => {
    const tail = pipe(ROA.tail(errs), O.getOrElse((): ReadonlyArray<ErrorMessage> => []))
    const head = pipe(ROA.head(errs), O.getOrElse(() => 'Uknown'));
    return pipe(tail,
        ROA.reduce(
            head,
            (errsStr, e) => `${errsStr} and ${e}`
    ))
}

export const inference: (d: Deductions) => E.Either<ErrorMessage, ProofLine> = flow(
    permuteDeduction,
    E.traverseArray(flow(evaluateDeduction, E.swap)),
    E.swap,
    E.mapLeft(combineDeductionErrors)
)

export const componentsToBoard: (comps: readonly [ReadonlyArray<ProofLine>, Proposition]) => Board
    = ([lines, proofTarget]) => ({lines, proofTarget});

const propToPremiseLine = (p: Proposition) => [p, 'Premise'] as ProofLine

export const toBoard: (props: ReadonlyArray<Proposition>) => E.Either<ErrorMessage | ParserError, Board> = flow(
    checkNonEmptyArray,
    E.map(RNEA.unappend),
    E.map(ROTUP.mapFst(ROA.map(propToPremiseLine))),
    E.map(componentsToBoard),
)