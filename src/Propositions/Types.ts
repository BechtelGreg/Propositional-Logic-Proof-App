import {Atomic, Binary, BinOps, Unary} from "./connectives";

export type BinOperation = (typeof BinOps)[number]
export type UnaryOperation = '~'
export type Conjunction = Binary & { operator: '*' }
export type Disjunction = Binary & { operator: 'v' }
export type Implication = Binary & { operator: '->' }
export type Equivalence = Binary & { operator: '<->' }
export type Negation = Unary & { operator: '~' }
export type BinCompounds = Conjunction | Disjunction | Implication | Equivalence
export type UnaryCompounds = Negation
export type Compounds = UnaryCompounds | BinCompounds
export type Propositions = Atomic | Compounds

export type BinaryOf<
    PropType1 extends Atomic | Unary | Binary,
    op extends BinOperation | UnaryOperation,
    PropType2 extends Atomic | Unary | Binary
> = {leftOperand: PropType1, operator: op, rightOperand: PropType2}

export type NegationOf<PropType extends Atomic | Unary | Binary> = {operator: '~', prop: PropType}

export type ConjunctionOf<
    PropType1 extends Atomic | Unary | Binary,
    PropType2 extends Atomic | Unary | Binary
> = BinaryOf<PropType1, '*', PropType2>

export type DisjunctionOf<
    PropType1 extends Atomic | Unary | Binary,
    PropType2 extends Atomic | Unary | Binary
> = BinaryOf<PropType1, 'v', PropType2>

export type ImplicationOf<
    PropType1 extends Atomic | Unary | Binary,
    PropType2 extends Atomic | Unary | Binary
> = BinaryOf<PropType1, '->', PropType2>

export type EquivalenceOf<
    PropType1 extends Atomic | Unary | Binary,
    PropType2 extends Atomic | Unary | Binary
> = BinaryOf<PropType1, '<->', PropType2>

