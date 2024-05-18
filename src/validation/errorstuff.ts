import {ImplicationalRules} from "../DeductionRules/rulesOfInference";

export type ErrorMessage = string


export type InferenceError = {
    [Rule in ImplicationalRules]: {
        readonly rule: Rule,
        readonly arguments: string,
        readonly errorMessage: ErrorMessage
    }
}[ImplicationalRules]




