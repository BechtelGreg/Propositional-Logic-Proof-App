import {
    BinOperation,
    Conjunction,
    Disjunction,
    Equivalence,
    getLeft,
    getNegated,
    getRight,
    Implication,
    isConjunctionProp,
    isDisjunctionProp,
    isEquivalenceProp,
    isImplicationProp,
    isNegationProp,
    matchesLeftOperand,
    matchesRightOperand,
    Negation, propIdentity,
    Relation,
    ShowCompound,
    ShowProp,
    UnaryOperation
} from "./connectives";
import * as E from "fp-ts/Either";
import * as Pred from "fp-ts/Predicate"
import * as M from "fp-ts/Monoid"
import {ErrorMessage, InferenceError, InferenceErrorU} from "./errorstuff";
import {flip, flow, hole, pipe} from "fp-ts/function";
import * as O from "fp-ts/Option";
import {get, persistLeft, uncurry} from "./utils";
import * as assert from "assert";
import {BrandRule, InferenceRule, Params, Proposition} from "./rulesOfInference";

const either = Pred.getMonoidAny<Proposition>().concat
const both = Pred.getMonoidAll<Proposition>().concat


const any = <T>(...arr: Array<Pred.Predicate<T>>) => M.concatAll(Pred.getMonoidAny<T>())(arr)
const all = <T>(...arr: Array<Pred.Predicate<T>>) => M.concatAll(Pred.getMonoidAll<T>())(arr)

export const checkNegation = (
    possibleNegation: Proposition
): E.Either<ErrorMessage, Negation> => {
    return pipe(
        possibleNegation,
        E.fromPredicate(
            isNegationProp,
            typeMisMatchMessage("~")
        )
    );
};
export const checkConjunction = (
    possibleConjunction: Proposition
): E.Either<ErrorMessage, Conjunction> => {
    return pipe(
        possibleConjunction,
        E.fromPredicate(
            isConjunctionProp,
            typeMisMatchMessage("*")
        )
    );
};
export const checkDisjunction = (
    possibleDisjunction: Proposition
): E.Either<ErrorMessage, Disjunction> => {
    return pipe(
        possibleDisjunction,
        E.fromPredicate(
            isDisjunctionProp,
            typeMisMatchMessage("v")
        )
    );
};
export const checkImplication = (
    possibleImplication: Proposition
): E.Either<ErrorMessage, Implication> => {
    return pipe(
        possibleImplication,
        E.fromPredicate(
            isImplicationProp,
            typeMisMatchMessage("->")
        )
    );
};
const checkEquivalence = (
    possibleEquivalence: Proposition
): E.Either<ErrorMessage, Equivalence> => {
    return pipe(
        possibleEquivalence,
        E.fromPredicate(
            isEquivalenceProp,
            typeMisMatchMessage("<->")
        )
    );
};
const typeMisMatchMessage: (op: UnaryOperation | BinOperation) => (p: Proposition) => string
    = op => flow(ShowProp, propStr => `'${propStr}' is not an ${ShowCompound(op)}`)
const checkInferenceMP = (params: Params<'Modus Ponens'>): E.Either<ErrorMessage, InferenceEvent<'Modus Ponens'>> => {
    const {proposition, implication, conclusion} = params
    return pipe(
        E.Do,
        E.let('proposition', () => proposition),
        E.bind('implication', () => checkImplication(implication)),
        E.let('conclusion', () => conclusion),
        E.let('_rule', () => 'Modus Ponens')
    )
}

export const checkInferenceMT = (params: Params<'Modus Tollens'>): E.Either<ErrorMessage, InferenceEvent<'Modus Tollens'>> => {
    const {negation, implication, conclusion} = params
    return pipe(
        E.Do,
        E.bind('implication', () => checkImplication(implication)),
        E.bind('negation', () => checkNegation(negation)),
        E.bind('conclusion', () => checkNegation(conclusion)),
        E.let('_rule', () => 'Modus Tollens')
    )
}

export const checkInferenceDS = (params: Params<'Disjunctive Syllogism'>): E.Either<ErrorMessage, InferenceEvent<'Disjunctive Syllogism'>> => {
    const {possibleDisjunction, possibleNegatedDisjunct, conclusion} = params
    return pipe(
        E.Do,
        E.bind('disjunction', () => checkDisjunction(possibleDisjunction)),
        E.bind('negation', () => checkNegation(possibleNegatedDisjunct)),
        E.let('conclusion', () => conclusion),
        E.let('_rule', () => 'Disjunctive Syllogism')
    )
}

const validateInferenceMP = (
    {proposition, implication, conclusion, _rule}: InferenceEvent<'Modus Ponens'>
): E.Either<ErrorMessage, ValidatedInferenceEvent<'Modus Ponens'>> =>
    pipe(
        E.Do,
        E.bind("proposition", () => pipe(
            proposition,
            E.fromPredicate(
                matchesLeftOperand(implication),
                psuedoAntecedent =>
                    `Proposition '${
                        ShowProp(psuedoAntecedent)
                    }' does not match antecedent '${
                        pipe(implication, getLeft, ShowProp)
                    }' of conditional '${
                        ShowProp(implication)
                    }'`
            )
        )),
        E.let("implication", () => implication),
        E.bind("conclusion", () => pipe(
            conclusion,
            E.fromPredicate(
                matchesRightOperand(implication),
                badConclusion => `The conclusion '${ShowProp(badConclusion)}'
                 doesn't match the consequent '${ShowProp(implication.rightOperand)}'`
            )
        )),
        E.let("_rule", rule(_rule)),
        E.map(validateInference)
    )

export const validateInferenceMT = (
    {negation, implication, conclusion, _rule}: InferenceEvent<'Modus Tollens'>
): E.Either<ErrorMessage, ValidatedInferenceEvent<'Modus Tollens'>> =>
    pipe(
        E.Do,
        E.bind("negation", () => pipe(
            negation,
            E.fromPredicate(flow(getNegated, matchesRightOperand(implication)),
                negation =>
                    `Proposition '${
                        ShowProp(negation)
                    }' does not negate consequent '${
                        pipe(implication, getRight, ShowProp)
                    }' of conditional '${
                        ShowProp(implication)
                    }'`
            ),
        )),
        E.let("implication", () => implication),
        E.bind("conclusion", () => pipe(
            conclusion,
            E.fromPredicate(
                flow(getNegated, matchesLeftOperand(implication)),
                badConclusion => `The conclusion '${ShowProp(badConclusion)}'
                 isn't the negation of the antecedent '${ShowProp(implication.leftOperand)}'`
            )
        )),
        E.let("_rule", rule(_rule)),
        E.map(validateInference)
    )

const isDisjunctOf = (d: Disjunction) => any(matchesLeftOperand(d), matchesRightOperand(d));
const negatedBy = (n: Negation) => (p: Proposition) => pipe(n, getNegated, propIdentity(p))

const performValidationDS = (
    ie: InferenceEvent<'Disjunctive Syllogism'>
): E.Either<ErrorMessage, InferenceEvent<'Disjunctive Syllogism'>> => {
    const {disjunction, negation, conclusion, _rule} = ie
    const isDisjunct = isDisjunctOf(disjunction)
    return pipe(
        ie,
        E.fromPredicate(
            flow(get('negation'), getNegated, isDisjunct),
            () => `${ShowProp(negation)} doesn't negate either disjunct of ${ShowProp(disjunction)}`
        ),
        E.chain(E.fromPredicate(
            flow(get('conclusion'), all(isDisjunct, Pred.not(negatedBy(negation)))),
            () => ""
        ))
    )
}
const validateInferenceDS = (
    ie: InferenceEvent<'Disjunctive Syllogism'>
): E.Either<ErrorMessage, ValidatedInferenceEvent<'Disjunctive Syllogism'>> => {
    const {disjunction, negation, conclusion, _rule} = ie
    const isDisjunct = isDisjunctOf(disjunction)
    return pipe(
        E.Do,
        E.bind("negation", () => pipe(
            negation,
            E.fromPredicate(
                flow(getNegated, isDisjunct),
                badNeg => `${ShowProp(badNeg)} doesn't negate either disjunct of ${ShowProp(disjunction)}`
            ),
        )),
        E.bind("conclusion", () => pipe(
            conclusion,
            E.fromPredicate(
                all(isDisjunct, Pred.not(negatedBy(negation))),
                () => ""
            )
        )),
        E.as(ie),
        E.map(validateInference)
    )
}

const wip = (disjunction: Disjunction) => Pred.getMonoidAny<Proposition>().concat(matchesLeftOperand(disjunction), matchesRightOperand(disjunction))

export const validateMP: (modusPonensParams: Params<'Modus Ponens'>) => E.Either<ErrorMessage, ValidatedInferenceEvent<"Modus Ponens">>
    = flow(checkInferenceMP, E.chain(validateInferenceMP))

export const validateMT: (modusPonensParams: Params<'Modus Tollens'>) => E.Either<ErrorMessage, ValidatedInferenceEvent<"Modus Tollens">>
    = flow(checkInferenceMT, E.chain(validateInferenceMT))

export const validateDS: (modusPonensParams: Params<'Disjunctive Syllogism'>) => E.Either<ErrorMessage, ValidatedInferenceEvent<"Disjunctive Syllogism">>
    = flow(checkInferenceDS, E.chain(validateInferenceDS))


export type ValidatedInferenceEvent<Rule extends InferenceRule> = InferenceEvent<Rule> & {
    readonly _valid: "Validated"
}
const ValidatedInferenceEvent = <Rule extends InferenceRule>(inference: InferenceEvent<Rule>): ValidatedInferenceEvent<Rule> => ({
    ...inference,
    _valid: 'Validated'
})
const validateInference = ValidatedInferenceEvent
export type ValidMT = {
    negatedConsequent: Negation,
    implication: Implication
} & { readonly _brand: "Validated" }
const ValidMT = (negatedConsequent: Negation) => (implication: Implication): ValidMT => ({
    negatedConsequent,
    implication,
    _brand: "Validated"
})
export type ValidMP = {
    antecedent: Proposition,
    implication: Implication
} & { readonly _brand: "Validated" }
const ValidMP = (antecedent: Proposition) => (implication: Implication): ValidMP => ({
    antecedent,
    implication,
    _brand: "Validated"
})
export type ValidDS = {
    negatedDisjunct: Negation,
    disjunction: Disjunction,
    consequentDisjunct: Proposition
} & { readonly _brand: "Validated" }
const ValidDS = (negatedDisjunct: Negation) => (disjunction: Disjunction) => (consequentDisjunct: Proposition): ValidDS => ({
    negatedDisjunct,
    disjunction,
    consequentDisjunct,
    _brand: "Validated"
})
export type ValidHS = {
    firstConditional: Implication,
    secondConditional: Implication
} & { readonly _brand: "Validated" }
const ValidHS = (firstConditional: Implication) => (secondConditional: Implication): ValidHS => ({
    firstConditional,
    secondConditional,
    _brand: "Validated"
})
export type ValidCD = {
    disjunctionOfAntecedents: Disjunction,
    leftConditional: Implication,
    rightConditional: Implication
}
const brandValid = <T extends ValidInferences, K extends Omit<T, '_brand'>>(k: K): 'Validated' => 'Validated'
const rule = <str extends InferenceRule>(s: str) => (): str => s
const revValidMT = flip(ValidMT);


export const checkValidHS = (
    {firstConditional, secondConditional}: Omit<ValidHS, '_brand'>
): E.Either<ErrorMessage, ValidHS> =>
    pipe(
        secondConditional,
        E.fromPredicate(matchesRightOperand(firstConditional),
            p => ""
        ),
        E.map(ValidHS(firstConditional))
    )
export const checkValidCD = ({
                                 disjunctionOfAntecedents,
                                 leftConditional,
                                 rightConditional
                             }: Omit<ValidCD, '_brand'>): E.Either<ErrorMessage, ValidCD> =>
    pipe(
        E.Do,
        E.let('disjunctionOfAntecedents', (): Disjunction => disjunctionOfAntecedents),
        E.bind('leftConditional',
            flow(
                get('disjunctionOfAntecedents'),
                getLeft,
                E.fromPredicate<Proposition, ErrorMessage>(
                    matchesLeftOperand(leftConditional),
                    () => ""
                ),
                E.as(leftConditional)
            )
        ),
        E.bind('rightConditional',
            flow(
                get('disjunctionOfAntecedents'),
                getLeft,
                E.fromPredicate<Proposition, ErrorMessage>(
                    matchesRightOperand(rightConditional),
                    () => ""
                ),
                E.as(rightConditional)
            )
        ),
        E.let('_brand', brandValid)
    )


export type InferenceEvent<Rule extends InferenceRule> =
    Rule extends "Modus Ponens"
        ? {
        proposition: Proposition,
        implication: Implication,
        conclusion: Proposition
    } & BrandRule<Rule>
        : Rule extends "Modus Tollens"
            ? {
            negation: Negation,
            implication: Implication,
            conclusion: Negation
        } & BrandRule<Rule>
            : Rule extends "Hypothetical Syllogism"
                ? {
                firstConditional: Implication,
                secondConditional: Implication,
                conclusion: Implication
            } & BrandRule<Rule>
                : Rule extends "Disjunctive Syllogism"
                    ? {
                    disjunction: Disjunction,
                    negation: Negation,
                    conclusion: Proposition
                } & BrandRule<Rule>
                    : Rule extends "Constructive Dilemma"
                        ? {
                        disjunction: Disjunction,
                        firstConditional: Implication,
                        secondConditional: Implication,
                        conclusion: Disjunction
                    } & BrandRule<Rule>
                        : Rule extends "Simplification"
                            ? {
                            conjunction: Conjunction,
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
                                    conclusion: Disjunction
                                } & BrandRule<Rule>
                                    : never
export type ValidInferences = ValidMP | ValidMT | ValidHS | ValidDS | ValidCD


const maybeLeft = (disjunction: Disjunction) => (negation: Negation) => pipe(
    negation,
    O.fromPredicate(negatesLeftDisjunct(disjunction)),
    O.as({consequentDisjunct: disjunction.leftOperand, negatedDisjunct: negation})
)
const maybeRight = (disjunction: Disjunction) => (negation: Negation) => pipe(
    negation,
    O.fromPredicate(negatesRightDisjunct(disjunction)),
    O.as({consequentDisjunct: disjunction.rightOperand, negatedDisjunct: negation})
)

const negatesLeftDisjunct: Relation<Disjunction, Negation>
    = (disjunction: Disjunction) => flow(getNegated, pipe(disjunction, getLeft, propIdentity));
const negatesRightDisjunct: Relation<Disjunction, Negation>
    = (disjunction: Disjunction) => flow(getNegated, pipe(disjunction, getRight, propIdentity));

const inferByMP: Inference<'Modus Ponens', Proposition> = ({conclusion}) => conclusion;

type Inference<R extends InferenceRule, P extends Proposition> = (vi: ValidatedInferenceEvent<R>) => P

// export const concludeOrElse: <R extends InferenceRule>(infErrConstructor: (args: Params<R>) => (errorMessage: string) => InferenceError<R>) => (fa: E.Either<[Params<R>, ErrorMessage], ValidatedInferenceEvent<R>>) => E.Either<InferenceError<R>, Proposition>
//     = iec => flow(E.bimap(uncurry(iec), infer))
export const infer = <R extends InferenceRule>({conclusion}: ValidatedInferenceEvent<R>): ValidatedInferenceEvent<R>['conclusion'] => conclusion

export type Validator<R extends InferenceRule> = (p: Params<R>) => E.Either<ErrorMessage, ValidatedInferenceEvent<R>>

export const handleInference = <R extends InferenceRule>(v: Validator<R>): (p: Params<R>) => E.Either<InferenceErrorU, Proposition> =>
    flow(persistLeft(v), flow(E.bimap(uncurry(InferenceError), infer)))
type IR = 'Modus Ponens' | 'Modus Tollens' | 'Disjunctive Syllogism'
type VallidationF<R> = R extends IR ? (k: R) => E.Either<ErrorMessage, ValidatedInferenceEvent<R>> : never
type VallidateF = VallidationF<IR>
const validate2 : VallidateF = k => {
    switch (k) {
        case "Modus Ponens":
            return validateMP
        case "Modus Tollens":
            return validateMT
        case "Disjunctive Syllogism":
            return validateDS
    }
}

export const validate = validate2

