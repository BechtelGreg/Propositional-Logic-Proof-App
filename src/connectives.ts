import * as PRED from "fp-ts/Predicate"
import * as RFN from 'fp-ts/Refinement'
import * as RONEA from "fp-ts/ReadonlyNonEmptyArray"

import {flow, pipe} from "fp-ts/function";
import {Show} from "fp-ts/Show";
import {Proposition} from "./rulesOfInference";


export type Relation<T, U> = (t: T) => PRED.Predicate<U>
export type Relation3<T, U, V> = (t: T) => (u: U) => PRED.Predicate<V>
export type Atomic = 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W'
export type Compound = Unary | Binary
export type Unary = { operator: UnaryOperation, prop: Proposition }
export const getNegated = (n: Negation): Proposition => n.prop

export type Binary = { operator: BinOperation, leftOperand: Proposition, rightOperand: Proposition }
export const getLeft = <P extends Proposition, T extends { leftOperand: P }>(t: T): P => t.leftOperand
export const getRight = <P extends Proposition, T extends { rightOperand: P }>(t: T): P => t.rightOperand


export const getOp = (c: Compound): UnaryOperation | BinOperation =>
    isUnaryProp(c)
        ? c.operator
        : c.operator;
export const getOperator = getOp as { (c: Unary): UnaryOperation, (c: Binary): BinOperation }


export const matchesLeftOperand = flow(getLeft, propIdentity);

export const matchesRightOperand = flow(getRight, propIdentity);

export type BinOperation = '*' | 'v' | '->' | '<->'
export type UnaryOperation = '~'

export const AtomicProps: RONEA.ReadonlyNonEmptyArray<Atomic> = nonEmpArr('P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W')
export const isAtomic: RFN.Refinement<Proposition, Atomic> = (p: Proposition): p is Atomic => {
    return typeof p === 'string'
}
export const isUnaryCompound: RFN.Refinement<Compound, Unary> = (c: Compound): c is Unary => c.operator === '~'

export const isBinaryCompound: RFN.Refinement<Compound, Binary> = RFN.not(isUnaryCompound)

export const isUnaryProp: RFN.Refinement<Proposition, Unary> =
    pipe(
        RFN.not(isAtomic),
        RFN.compose(RFN.not(isBinaryCompound))
    )

export const isBinaryProp: (p: Proposition) => p is Binary = pipe(
    RFN.not(isAtomic),
    RFN.compose<Proposition, Compound, Binary>(RFN.not(isUnaryCompound))
);


export type Conjunction = Binary & { operator: '*' }
export const Conjunction = <P extends Proposition>(p: P) =>
    <Q extends Proposition>(q: Q): Conjunction =>
        ({leftOperand: p, operator: '*', rightOperand: q})
export const ConjunctionPDGM: Conjunction = {leftOperand: 'P', operator: '*', rightOperand: 'P'}

export type Disjunction = Binary & { operator: 'v' }
export const Disjunction = <P extends Proposition>(p: P) =>
    <Q extends Proposition>(q: Q): Disjunction =>
        ({leftOperand: p, operator: 'v', rightOperand: q})
export const DisjunctionPDGM: Disjunction = {leftOperand: 'P', operator: 'v', rightOperand: 'P'}


export type Implication = Binary & { operator: '->' }
export const Implication = <P extends Proposition>(p: P) =>
    <Q extends Proposition>(q: Q): Implication =>
        ({leftOperand: p, operator: '->', rightOperand: q})
export const ImplicationPDGM: Implication = {leftOperand: 'P', operator: '->', rightOperand: 'P'}
export type Equivalence = Binary & { operator: '<->' }
export const Equivalence = <P extends Proposition>(p: P) =>
    <Q extends Proposition>(q: Q): Equivalence =>
        ({leftOperand: p, operator: '<->', rightOperand: q})
export const EquivalencePDGM: Equivalence = {leftOperand: 'P', operator: '<->', rightOperand: 'P'}
export type Negation = Unary & { operator: '~' }
export const NegationPDGM: Negation = {operator: '~', prop: 'P'}
export const Negation = <P extends Proposition>(p: P): Negation => ({operator: '~', prop: p})

export const isNegationProp: RFN.Refinement<Proposition, Negation> = (p: Proposition): p is Negation => isUnaryProp(p)

export const isConjunctionBinary = isGivenBinary(ConjunctionPDGM);
export const isConjunctionProp: RFN.Refinement<Proposition, Conjunction> =
    pipe(
        isBinaryProp,
        RFN.compose(isConjunctionBinary)
    )
export const isDisjunctionBinary = isGivenBinary(DisjunctionPDGM);
export const isDisjunctionProp: RFN.Refinement<Proposition, Disjunction> =
    pipe(
        isBinaryProp,
        RFN.compose(isDisjunctionBinary)
    )
export const isImplicationBinary = isGivenBinary(ImplicationPDGM);
export const isImplicationProp: RFN.Refinement<Proposition, Implication> =
    pipe(
        isBinaryProp,
        RFN.compose(isImplicationBinary)
    )
export const isEquivalenceBinary = isGivenBinary(EquivalencePDGM)
export const isEquivalenceProp: RFN.Refinement<Proposition, Equivalence> =
    pipe(
        isBinaryProp,
        RFN.compose(isEquivalenceBinary)
    )


export type BinCompounds = Conjunction | Disjunction | Implication | Equivalence
export type UnaryCompounds = Negation

export type Compounds = UnaryCompounds | BinCompounds

export type Propositions = Atomic | Compounds


export function propIdentity(p: Proposition): (q: Proposition) => boolean {
    return q => {
        if (isAtomic(p) && isAtomic(q)) {
            return atomicIdentity(p)(q)
        } else if (isUnaryProp(p) && isUnaryProp(q)) {
            return unaryIdentity(p)(q)
        } else if (isBinaryProp(p) && isBinaryProp(q)) {
            return binaryIdentity(p)(q)
        } else {
            return false
        }
    }
}

export function isGivenBinary<BinComp extends BinCompounds>({operator}: BinComp): RFN.Refinement<Binary, BinComp> {
    return (b: Binary): b is BinComp => b.operator === operator
}

export function atomicIdentity(p: Atomic): (q: Atomic) => boolean {
    return q => p === q
}

export function unaryIdentity(p: Unary): (q: Unary) => boolean {
    return q => propIdentity(p.prop)(q.prop)
}

export function binaryIdentity(p: Binary): (q: Binary) => boolean {
    return q =>
        p.operator === q.operator
        && propIdentity(p.leftOperand)(q.leftOperand)
        && propIdentity(p.rightOperand)(q.rightOperand)
}

export function nonEmpArr<T>(first: T, ...rest: Array<T>): RONEA.ReadonlyNonEmptyArray<T> {
    return RONEA.concat(rest)(RONEA.of(first));
}

const Show: Show<Proposition> = {
    show: p => {
        if (isAtomic(p)) {
            return p
        } else if (isUnaryProp(p)) {
            return `${p.operator} ${Show.show(p.prop)}`
        } else if (isBinaryProp(p)) {
            return `${Show.show(p.leftOperand)} ${p.operator} ${Show.show(p.rightOperand)}`
        } else {
            return "Error: Should be impossible, what even is " + p
        }
    }
}

export const ShowProp = Show.show
export const ShowCompound = (op: BinOperation | UnaryOperation): string => {
    switch (op) {
        case "*":
            return 'Conjunction'
        case "~":
            return 'Negation'
        case "v":
            return 'Disjunction'
        case "->":
            return 'Implication'
        case "<->":
            return "Equivalence"
    }
}