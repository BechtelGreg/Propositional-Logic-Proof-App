import {Atomic, Compound, ShowProp} from "./connectives";

export type InferenceRule =
    | 'Modus Ponens'
    | 'Modus Tollens'
    | 'Hypothetical Syllogism'
    | 'Disjunctive Syllogism'
    | 'Constructive Dilemma'
    | 'Simplification'
    | 'Conjunction'
    | 'Addition'

export type Proposition = Atomic | Compound

export type BrandRule<Rule extends InferenceRule> = { _rule: Rule }

export type Params<Rule extends InferenceRule> =
    Rule extends "Modus Ponens"
        ? {
        proposition: Proposition,
        implication: Proposition,
        conclusion: Proposition
    } & BrandRule<Rule>
        : Rule extends "Modus Tollens"
            ? {
            negation: Proposition,
            implication: Proposition,
            conclusion: Proposition
        } & BrandRule<Rule>
            : Rule extends "Hypothetical Syllogism"
                ? {
                firstConditional: Proposition,
                secondConditional: Proposition,
                conclusion: Proposition
            } & BrandRule<Rule>
                : Rule extends "Disjunctive Syllogism"
                    ? {
                    possibleDisjunction: Proposition,
                    possibleNegatedDisjunct: Proposition,
                    conclusion: Proposition
                } & BrandRule<Rule>
                    : Rule extends "Constructive Dilemma"
                        ? {
                        conjunctionOfConditionals: Proposition,
                        disjunctionOfAntecedents: Proposition,
                        conclusion: Proposition
                    } & BrandRule<Rule>
                        : Rule extends "Simplification"
                            ? {
                            conjunction: Proposition,
                            conclusion: Proposition
                        } & BrandRule<Rule>
                            : Rule extends "Conjunction"
                                ? {
                                p: Proposition,
                                q: Proposition,
                                conclusion: Proposition
                            } & BrandRule<Rule>
                                : Rule extends "Addition"
                                    ? {
                                    p: Proposition,
                                    conclusion: Proposition
                                } & BrandRule<Rule>
                                    : never
export const showParams: <R extends InferenceRule> (p: Params<R>) => string
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