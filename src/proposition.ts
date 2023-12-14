import * as E from 'fp-ts/Either'
import {flow, hole, pipe} from "fp-ts/function";
import {Disjunction, getLeft, getRight, Implication, Negation} from './connectives';
import {
    ErrorMessage,
    InferenceError, InferenceErrorCstrctr, InferenceErrorU
} from './errorstuff';
import {
    handleInference,
    validateMP,
    validateMT,
    validateDS, validate
} from "./validation";
import {InferenceRule, Params, Proposition} from "./rulesOfInference";


type ParamValidator<R extends ImplInfRules> = (p: Params<R>) => E.Either<InferenceErrorU, Proposition>
type pmp = ParamValidator<'Modus Ponens'>
type ImplInfRules = 'Modus Ponens' | 'Modus Tollens' | 'Disjunctive Syllogism'
type ParameterValidator =
    & ParamValidator<'Modus Ponens'>
    & ParamValidator<'Modus Tollens'>
    & ParamValidator<'Disjunctive Syllogism'>

const ParameterValidator: ParameterValidator = p => {
    const validateElement = validate(p._rule);
    const f : E.Either<InferenceErrorU, Proposition> = handleInference(validateElement)(p);
    return f
}
export const modusPonens: ParamValidator<'Modus Ponens'>
    = p => pipe(validate[p._rule], handleInference)(p)

export const modusTollens: ParamValidator<'Modus Tollens'>
    = p => pipe(validate[p._rule], handleInference)(p)

export const disjunctiveSyllogism: ParamValidator<'Disjunctive Syllogism'>
    = p => pipe(validate[p._rule], handleInference)(p)

// export const hypotheticalSyllogism: (hsp: Params<'Hypothetical Syllogism'>) => E.Either<InferenceError<'Hypothetical Syllogism'>, Implication> =
//     pipe(validateHS, handleInference('Hypothetical Syllogism'))
//
// export const constructiveDilemma: (cdp: Params<'Constructive Dilemma'>) => E.Either<InferenceError<'Constructive Dilemma'>, Disjunction> =
//         ({conjunctionOfConditionals, disjunctionOfAntecedents}) => pipe(
//             E.Do,
//             E.bind('conjunction', () => checkConjunction(conjunctionOfConditionals)),
//             E.bind('leftConditional', flow(get('conjunction'), getLeft, checkImplication)),
//             E.bind('rightConditional', flow(get('conjunction'), getRight, checkImplication)),
//             E.bind('disjunctionOfAntecedents', () => checkDisjunction(disjunctionOfAntecedents)),
//             E.chain(checkValidCD),
//             E.map(inferByCD),
//             E.mapLeft(cdInferenceError([conjunctionOfConditionals, disjunctionOfAntecedents]))
//         )

// export const simplification: (sp: Params<'Simplification'>) => E.Either<InferenceError<'Simplification'>, Proposition> =
//         ({conjunction}) => pipe(
//
//         )








