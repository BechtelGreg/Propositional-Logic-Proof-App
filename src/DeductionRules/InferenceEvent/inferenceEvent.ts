import {BrandRule, CitesJustification, DeductionRules} from "../rulesOfInference";
import {Proposition} from "../../Propositions/connectives";
import {Conjunction, ConjunctionOf, Disjunction, DisjunctionOf, Implication, Negation} from "../../Propositions/Types";
import {DisjunctiveAssociationEvent, EquivalenceEvents} from "./EquivelenceInferenceEvent";

export type InferenceEvent<Rule extends DeductionRules>
    = Extract<InferenceEvents, BrandRule<Rule>>

export type InferenceEvents =
    | {
    proposition: Proposition,
    implication: Implication,
    conclusion: Proposition
} & CitesJustification<"Modus Ponens">
    | {
    negation: Negation,
    implication: Implication,
    conclusion: Negation
} & CitesJustification<"Modus Tollens">
    | {
    firstConditional: Implication,
    secondConditional: Implication,
    conclusion: Implication
} & CitesJustification<"Hypothetical Syllogism">
    | {
    disjunction: Disjunction,
    negation: Negation,
    conclusion: Proposition
} & CitesJustification<"Disjunctive Syllogism">
    | {
    disjunctionOfAntecedents: Disjunction,
    firstConditional: Implication,
    secondConditional: Implication,
    conclusion: Disjunction
} & CitesJustification<"Constructive Dilemma">
    | {
    conjunction: Conjunction,
    conclusion: Proposition
} & CitesJustification<"Simplification">
    | {
    p: Proposition,
    q: Proposition,
    conclusion: Conjunction
} & CitesJustification<"Conjunction">
    | {
    p: Proposition,
    conclusion: Disjunction
} & CitesJustification<"Addition">
| EquivalenceEvents




