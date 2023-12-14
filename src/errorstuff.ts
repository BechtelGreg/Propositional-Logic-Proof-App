import {InferenceRule, Params, showParams} from "./rulesOfInference";

export type ErrorMessage = string


export type InferenceError<Rule> = Rule extends InferenceRule
     ? {
        readonly rule: Rule,
        readonly arguments: string,
        readonly errorMessage: ErrorMessage
    }
    : never

export type InferenceErrorU = InferenceError<InferenceRule>


export type InferenceErrorCstrctr = <R extends InferenceRule>(
    args: Params<R>
) => (
    errorMessage: ErrorMessage
) => InferenceErrorU
export const InferenceError: InferenceErrorCstrctr
    = args => errorMessage => ({
    rule: args._rule,
    arguments: showParams(args),
    errorMessage
})


