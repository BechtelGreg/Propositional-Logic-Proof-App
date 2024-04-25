import {Proposition} from "../Propositions/connectives";
import {DeductionRules, LineReference} from "../DeductionRules/rulesOfInference";
import {pipe} from "fp-ts/function";
import * as ROA from 'fp-ts/ReadonlyArray'
import {permutations} from "../utils";

export type Board = {
    lines: ReadonlyArray<ProofLine>,
    proofTarget: Proposition
}

export type ProofLine = readonly [Proposition, Justifications | 'Premise'];
export type ProofLineFormater = { spaces: (n: number) => string, offset: number }


export type Justifications = {
    [Rule in DeductionRules]: {
        _rule: Rule, lines: LineReference<Rule>
    }
}[DeductionRules]


export type Justification<Rule extends DeductionRules> = Extract<Justifications, { _rule: Rule }>


export type Deductions = {
    [Rule in DeductionRules]: {
        _rule: Rule,
        conclusion: Proposition,
        premises: ReadonlyArray<readonly [Index, Proposition]>
    }
}[DeductionRules]

export type Deduction<R extends DeductionRules> = Extract<Deductions, { _rule: R }>
export const makeDeductionBy = <R extends DeductionRules>(_rule: R) =>
    ({conclusion, premises}: Omit<Deduction<R>, '_rule'>): Deduction<R> => {
        return {_rule, conclusion, premises} as Deduction<R>
    }

export const permuteDeduction: (d: Deductions) => ReadonlyArray<Deductions>
    = d =>
    pipe(d.premises,
        permutations,
        ROA.map(p => ({conclusion: d.conclusion, premises: p})),
        ROA.map(makeDeductionBy(d._rule))
    )

export type Index = number & { inRange: true }



