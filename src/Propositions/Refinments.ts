import * as RFN from "fp-ts/Refinement";
import {flow, pipe} from "fp-ts/function";
import {
    Atomic,
    Binary,
    Compound,
    Proposition,
    Unary
} from "./connectives"

const decideBin = <OP extends BinOperation>(op: OP): Refinement<Binary, Binary & { operator: OP }> => {
    return (b: Binary): b is Binary & { operator: OP } => b.operator == op
}

import {
    BinaryOf,
    BinCompounds,
    BinOperation,
    Conjunction, ConjunctionOf,
    Disjunction,
    DisjunctionOf,
    Equivalence,
    Implication,
    Negation
} from "./Types";
import {Refinement} from "fp-ts/Refinement";
import {get} from "../utils";
import * as ROA from "fp-ts/ReadonlyArray";
import * as RTUP from "fp-ts/ReadonlyTuple";

export const propIsAtomic: RFN.Refinement<Proposition, Atomic> = (p: Proposition): p is Atomic => {
    return typeof p === 'string'
}


export const propIsUnaryCompound: RFN.Refinement<Proposition, Unary> =
    pipe(RFN.not(propIsAtomic), RFN.compose(isUnaryCompound))

export const propIsBinaryCompound: (p: Proposition) => p is Binary
    = pipe(RFN.not(propIsAtomic), RFN.compose<Proposition, Compound, Binary>(RFN.not(isUnaryCompound)));

export const propIsBinCompound: (p: Proposition) => p is Binary =
    pipe(RFN.not(propIsAtomic), RFN.compose(RFN.not(isUnaryCompound)))

export function isUnaryCompound(c: Compound): c is Unary {
    return c.operator === '~'
}

export const isBinaryCompound: RFN.Refinement<Compound, Binary> = RFN.not(isUnaryCompound)


export const isConjunctionBinary: RFN.Refinement<Binary, Conjunction> = decideBin('*');
export const isConjunctionProp: RFN.Refinement<Proposition, Conjunction>
    = pipe(propIsBinaryCompound, RFN.compose(isConjunctionBinary))
export const isDisjunctionBinary = decideBin('v');
export const isDisjunctionProp: RFN.Refinement<Proposition, Disjunction>
    = pipe(propIsBinaryCompound, RFN.compose(isDisjunctionBinary))
export const isImplicationBinary = decideBin('->');
export const isImplicationProp: RFN.Refinement<Proposition, Implication>
    = pipe(propIsBinaryCompound, RFN.compose(isImplicationBinary))
export const isEquivalenceBinary = decideBin('<->')
export const isEquivalenceProp: RFN.Refinement<Proposition, Equivalence>
    = pipe(propIsBinaryCompound, RFN.compose(isEquivalenceBinary))

export function isGivenBinary<BinComp extends BinCompounds>({
                                                                leftOperand,
                                                                operator,
                                                                rightOperand
                                                            }: BinComp): RFN.Refinement<Binary, BinComp> {
    return (b: Binary): b is BinComp => b.operator === operator
}

export function propIdentity(p: Proposition): (q: Proposition) => boolean {
    return q => {
        if (propIsAtomic(p) && propIsAtomic(q)) {
            return atomicIdentity(p)(q)
        } else if (propIsUnaryCompound(p) && propIsUnaryCompound(q)) {
            return unaryIdentity(p)(q)
        } else if (propIsBinaryCompound(p) && propIsBinaryCompound(q)) {
            return binaryIdentity(p)(q)
        } else {
            return false
        }
    }
}

export const composedOf = (left: Proposition) => (right: Proposition) => (b: Binary) => {
    return propIdentity(b.leftOperand)(left) && propIdentity(b.rightOperand)(right)
}

export const composedOfComm = (p: Proposition) => (q: Proposition) => (b: Binary) => {
    return composedOf(p)(q)(b) || composedOf(q)(p)(b)
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

export const isNegationProp: RFN.Refinement<Proposition, Negation> = (p: Proposition): p is Negation => propIsUnaryCompound(p)


export const decompBin =
    <L extends Proposition, OP extends BinOperation, R extends Proposition>
    (b: BinaryOf<L, OP, R>): readonly [L, R] => [b.leftOperand, b.rightOperand]

export const decompBinofBin: <
    OP3 extends BinOperation,
    L1 extends Proposition, OP1 extends BinOperation, R1 extends Proposition,
    L2 extends Proposition, OP2 extends BinOperation, R2 extends Proposition
>(
    b : BinaryOf<
        BinaryOf<L1, OP1, R1>,
        OP3,
        BinaryOf<L2, OP2, R2>
    >
) => readonly [readonly [L1, R1], readonly [L2, R2]]
    = flow(decompBin, RTUP.bimap(decompBin, decompBin))

