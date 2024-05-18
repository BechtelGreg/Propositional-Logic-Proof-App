import * as PRED from "fp-ts/Predicate"
import * as RONEA from "fp-ts/ReadonlyNonEmptyArray"

import {flow} from "fp-ts/function";
import {Show} from "fp-ts/Show";
import {propIdentity, propIsAtomic, propIsBinaryCompound, propIsUnaryCompound} from "./Refinments";
import {
    BinOperation,
    Conjunction,
    Disjunction,
    Equivalence,
    Implication,
    Negation,
    NegationOf,
    UnaryOperation
} from "./Types";

export type Proposition = Atomic | Compound


export type Relation<T, U> = (t: T) => PRED.Predicate<U>
export const Atomics = [
    'A','B','C','D',
    'E','F','G',
    'H','I','J','K',
    'L','M','N','O','P',
    'Q','R','S',
    'T','U','V',
    'W','X','Y','Z'
] as const

export type Atomic = (typeof Atomics)[number]

export type Compound = Unary | Binary
export type Unary = { operator: UnaryOperation, prop: Proposition }
export const getNegated = <P extends Proposition>(n: NegationOf<P>): P => n.prop

export type Binary = { operator: BinOperation, leftOperand: Proposition, rightOperand: Proposition }
export const getLeft = <P extends Proposition, T extends { leftOperand: P }>(t: T): P => t.leftOperand
export const getRight = <P extends Proposition, T extends { rightOperand: P }>(t: T): P => t.rightOperand


export const getOp = (c: Compound): UnaryOperation | BinOperation =>
    propIsUnaryCompound(c)
        ? c.operator
        : c.operator;
export const getOperator = getOp as { (c: Unary): UnaryOperation, (c: Binary): BinOperation }


export const matchesLeftOperand = flow(getLeft, propIdentity);

export const matchesRightOperand = flow(getRight, propIdentity);



export const BinOps = ['*', 'v', '->', '<->'] as const
export const AtomicProps: RONEA.ReadonlyNonEmptyArray<Atomic> = nonEmpArr('P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W')


export const makeConjunction = <P extends Proposition>(p: P) =>
    <Q extends Proposition>(q: Q): Conjunction =>
        ({leftOperand: p, operator: '*', rightOperand: q})

export const makeDisjunction = <P extends Proposition>(p: P) =>
    <Q extends Proposition>(q: Q): Disjunction =>
        ({leftOperand: p, operator: 'v', rightOperand: q})


export const makeImplication = <P extends Proposition>(p: P) =>
    <Q extends Proposition>(q: Q): Implication =>
        ({leftOperand: p, operator: '->', rightOperand: q})
export const makeEquivalence = <P extends Proposition>(p: P) =>
    <Q extends Proposition>(q: Q): Equivalence =>
        ({leftOperand: p, operator: '<->', rightOperand: q})
export const makeNegation = <P extends Proposition>(p: P): NegationOf<P> => ({operator: '~', prop: p})


export function nonEmpArr<T>(first: T, ...rest: Array<T>): RONEA.ReadonlyNonEmptyArray<T> {
    return RONEA.concat(rest)(RONEA.of(first));
}

const Show: Show<Proposition> = {
    show: p => {
        if (propIsAtomic(p)) {
            return p
        } else if (propIsUnaryCompound(p)) {
            return `${p.operator} ${Show.show(p.prop)}`
        } else if (propIsBinaryCompound(p)) {
            return `(${Show.show(p.leftOperand)} ${p.operator} ${Show.show(p.rightOperand)})`
        } else {
            return "Error: Should be impossible, what even is " + p
        }
    }
}

export const antecedentOf: <Imp extends Implication>(imp: Imp) => Proposition = getLeft
export const consequentOf: <Imp extends Implication>(imp: Imp) => Proposition = getRight

export const leftDisjunct: <Dis extends Disjunction>(dis: Dis) => Proposition = getLeft
export const rightDisjunct: <Dis extends Disjunction>(dis: Dis) => Proposition = getRight

export const leftConjunct: <Con extends Conjunction>(con: Con) => Proposition = getLeft
export const rightConjunct: <Con extends Conjunction>(con: Con) => Proposition = getRight


export const leftEq: <Eq extends Equivalence>(eq: Eq) => Proposition = getLeft
export const rightEq: <Eq extends Equivalence>(eq: Eq) => Proposition = getRight



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
