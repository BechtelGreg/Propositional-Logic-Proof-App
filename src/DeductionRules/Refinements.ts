import * as REF from 'fp-ts/Refinement'
import * as RA from 'fp-ts/ReadonlyArray'
import {equivalenceRules, EquivalenceRules, ImplicationalRules, implRules} from "./rulesOfInference";
import {pipe} from "fp-ts/function";
import * as PRD from 'fp-ts/Predicate'


export const isImplicationalRule: REF.Refinement<string, ImplicationalRules>
    = (s): s is ImplicationalRules => pipe(
    implRules,
    RA.some(r => r == s)
)

export const isEquivalenceRule: REF.Refinement<string, EquivalenceRules>
    = (s): s is EquivalenceRules => pipe(
    equivalenceRules,
    RA.some(r => r == s)
)

export const isDeductionRule
    = pipe(isImplicationalRule, REF.or(isEquivalenceRule))