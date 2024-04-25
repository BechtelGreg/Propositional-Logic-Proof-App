import {Atomic, Compound, Proposition, ShowProp} from "../Propositions/connectives";
import {Index} from "../Board/Types";
import {Show} from "fp-ts/Show";
import * as R from 'fp-ts/Record'
import * as ROA from 'fp-ts/ReadonlyArray'
import {pipe} from "fp-ts/function";
import {Flatten} from "../utils";


export const singletonRules = ['Simplification', 'Addition'] as const
export type SingletonRules = (typeof singletonRules)[number]

export const twoTupleRules = [
    'Modus Ponens',
    'Modus Tollens',
    'Disjunctive Syllogism',
    'Hypothetical Syllogism',
    'Conjunction'
] as const
export type TwopleRules = (typeof twoTupleRules)[number]

export const tripleRules = ['Constructive Dilemma'] as const
export type TripleRules = (typeof tripleRules)[number]


export const implRules = [
    ...singletonRules,
    ...twoTupleRules,
    ...tripleRules
] as const

export const equivalenceRules = [
    'DoubleNegation',
    'Exportation',
    'Commutation',
    'Distribution',
    'Association',
    'Redundancy',
    'DeMorgans',
    'Material Equivalence',
    'Contraposition',
    'Material Implication'
] as const

export const deductionRules = [...implRules, ...equivalenceRules] as const

export type DeductionRules = ImplicationalRules | EquivalenceRules

export type ImplicationalRules =
    | TwopleRules
    | TripleRules
    | SingletonRules

export type EquivalenceRules = (typeof equivalenceRules)[number]


const abbreviationsForRule = {
    "Constructive Dilemma": ['CD', 'ConDi'],
    "Disjunctive Syllogism": ['DS'],
    "Hypothetical Syllogism": ['HS'],
    "Modus Ponens": ['MP'],
    "Modus Tollens": ['MT'],
    "Addition": ['Add', 'ADD'],
    "Conjunction": ['Conj', 'CONJ'],
    "Simplification": ['Simp', 'Smp', 'SIMP', 'SMP'],
    "Material Equivalence": ['ME', 'Me'],
    "Contraposition": ['Cont', 'Contra', 'Con', 'CONT', 'CONTRA', 'CON'],
    "Distribution": ['Dist', 'Dis', 'DIST', 'DIS'],
    "Association": ['Ass', 'Assc', 'ASS', 'ASSC'],
    "Redundancy": ['Re', 'Red', 'RE', 'RED'],
    "DeMorgans": ['Dem', 'Dmrg', 'Dm', 'DEM', 'DMRG', 'DM'],
    "Exportation": ['Ex', 'Exp', 'EX', 'EXP'],
    "Material Implication": ['MI', 'Mi'],
    "DoubleNegation": ['Dn', 'DN'],
    "Commutation": ['Com', 'Comm', 'COM', 'COMM']
} as const

export type Abbreviations = Flatten<(typeof abbreviationsForRule)[DeductionRules]>


export const abbrevToDedRule: Map<Abbreviations, DeductionRules> = pipe(
    abbreviationsForRule,
    R.toEntries,
    ROA.fromArray,
    ROA.reduce(new Map<Abbreviations, DeductionRules>(),
        (m, [rule, abbrvs]) => {
            for (let abbrv of abbrvs) {
                m.set(abbrv, rule)
            }
            return m
        })
)


export type BrandRule<Rule extends ImplicationalRules | EquivalenceRules> = { _rule: Rule }
const BrandRule = <Rule extends ImplicationalRules | EquivalenceRules>(_rule: Rule): BrandRule<Rule> => ({_rule})
const brandedRule = <Rule extends ImplicationalRules | EquivalenceRules>({_rule}: BrandRule<Rule>): Rule => _rule

export type LineReference<T extends DeductionRules> =
    T extends SingletonRules | EquivalenceRules
        ? [Index]
        : T extends TwopleRules
            ? [Index, Index]
            : [Index, Index, Index]


export type CitesJustification<Rule extends DeductionRules> =
    BrandRule<Rule> & CitesLineNumbers<Rule>;

export type CitesLineNumbers<Rule extends DeductionRules> = { lineNumbers: LineReference<Rule> }

export type Params<T extends DeductionRules> =
    Extract<Parameters, { _rule: T }>

export type EquivalenceParam<T extends EquivalenceRules> =
    Extract<EquivalenceParams, { _rule: T }>


export type Parameters =
    | {
    proposition: Proposition,
    implication: Proposition,
    conclusion: Proposition
} & CitesJustification<"Modus Ponens">
    | {
    negation: Proposition,
    implication: Proposition,
    conclusion: Proposition
} & CitesJustification<"Modus Tollens">
    | {
    firstConditional: Proposition,
    secondConditional: Proposition,
    conclusion: Proposition
} & CitesJustification<"Hypothetical Syllogism">
    | {
    possibleDisjunction: Proposition,
    possibleNegatedDisjunct: Proposition,
    conclusion: Proposition
} & CitesJustification<"Disjunctive Syllogism">
    | {
    firstConditional: Proposition,
    secondConditional: Proposition,
    disjunctionOfAntecedents: Proposition,
    conclusion: Proposition
} & CitesJustification<"Constructive Dilemma">
    | {
    conjunction: Proposition,
    conclusion: Proposition
} & CitesJustification<"Simplification">
    | {
    p: Proposition,
    q: Proposition,
    conclusion: Proposition
} & CitesJustification<"Conjunction">
    | {
    p: Proposition,
    conclusion: Proposition
} & CitesJustification<"Addition">
    | EquivalenceParams

export type EquivalenceParams = {
    [rule in EquivalenceRules]: {
    ps: ReadonlyArray<Proposition>,
    conclusion: Proposition
} & CitesJustification<rule>
}[EquivalenceRules]

export const showParams: (p: Parameters) => string
    = p => {
    switch (p._rule) {
        case "Modus Ponens":
            return `{implication: ${p.implication}, antecedent: ${p.proposition}, conclusion: ${p.conclusion}}`
        case "Modus Tollens":
            return `{implication: ${ShowProp(p.implication)}, negation: ${ShowProp(p.negation)}, conclusion: ${ShowProp(p.conclusion)}}`
        default:
            return `rule '${p._rule}' not yet showable`
    }
}

export const ShowRule: Show<DeductionRules> = {
    show: (r) => '\'ShowRule: Show{DeductionRules}\' Not Implemented yet'
}