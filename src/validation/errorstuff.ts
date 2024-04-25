import {ImplicationalRules, Parameters, Params, showParams} from "../DeductionRules/rulesOfInference";
import {NaturalTransformation} from "fp-ts/NaturalTransformation";
import {Proposition} from "../Propositions/connectives";

export type ErrorMessage = string


export type InferenceError = {
    [Rule in ImplicationalRules]: {
        readonly rule: Rule,
        readonly arguments: string,
        readonly errorMessage: ErrorMessage
    }
}[ImplicationalRules]




