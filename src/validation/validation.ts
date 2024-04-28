import {
    antecedentOf, Binary, consequentOf,
    getLeft,
    getNegated,
    getRight, makeImplication, makeNegation,
    matchesLeftOperand,
    matchesRightOperand,
    Proposition,
    Relation,
    ShowCompound,
    ShowProp
} from "../Propositions/connectives";
import * as E from "fp-ts/Either";
import * as IOE from 'fp-ts/IOEither'
import * as Pred from "fp-ts/Predicate"
import * as REF from "fp-ts/Refinement"
import * as RTUP from 'fp-ts/ReadonlyTuple'

import * as M from "fp-ts/Monoid"
import {Eq} from "fp-ts/Eq"
import * as S from "fp-ts/string"
import * as ROA from "fp-ts/ReadonlyArray"
import {ErrorMessage} from "./errorstuff";
import {flip, flow, pipe, tupled} from "fp-ts/function";
import * as O from "fp-ts/Option";
import {get, oneOfEithers, persistLeft, persistRight, traverseArrayLeft, applyTup, uncurry, applyTupC} from "../utils";
import {
    DeductionRules,
    EquivalenceParams,
    EquivalenceRules, EquivalenceParam,
    ImplicationalRules,
    LineReference,
    Parameters,
    Params, ShowRule
} from "../DeductionRules/rulesOfInference";
import {InferenceEvent} from "../DeductionRules/InferenceEvent/inferenceEvent";
import {
    composedOf,
    composedOfComm,
    propIsAtomic,
    isBinaryCompound,
    isConjunctionProp,
    isDisjunctionProp,
    isEquivalenceProp,
    isImplicationProp,
    isNegationProp,
    propIdentity, decompBin, decompBinofBin,
} from "../Propositions/Refinments";
import {
    BinaryOf,
    BinOperation,
    Conjunction, ConjunctionOf,
    Disjunction, DisjunctionOf,
    Equivalence,
    Implication, ImplicationOf,
    Negation, NegationOf,
    UnaryOperation
} from "../Propositions/Types";
import {EquivalenceEvent, EquivalenceEvents} from "../DeductionRules/InferenceEvent/EquivelenceInferenceEvent";
import {NewLine} from "../IoTasks/InputOutput";

export type ValidInferenceEvent = {
    [Rule in DeductionRules]: ValidatedInferenceEvent<Rule>
}[DeductionRules]

export type ValidatedInferenceEvent<Rule extends DeductionRules> = InferenceEvent<Rule> & {
    readonly _valid: "Validated",
}
const validateInference = <Rule extends DeductionRules>(inference: InferenceEvent<Rule>): ValidatedInferenceEvent<Rule> => ({
    ...inference,
    _valid: 'Validated'
})

const rule = <Rule extends ImplicationalRules>(s: Rule) => (): Rule => s

const either = Pred.getMonoidAny<Proposition>().concat
const both = Pred.getMonoidAll<Proposition>().concat


const any = <T>(...arr: Array<Pred.Predicate<T>>) => M.concatAll(Pred.getMonoidAny<T>())(arr)
const all = <T>(...arr: Array<Pred.Predicate<T>>) => M.concatAll(Pred.getMonoidAll<T>())(arr)


const identityFailureMessageE = (e: EquivalenceEvents) => () => {
    switch (e._rule) {
        case "Association":
        case "Commutation":
        case "Contraposition":
        case "DeMorgans":
        case "Distribution":
        case "DoubleNegation":
        case "Exportation":
        case "Material Equivalence":
        case "Material Implication":
        case "Redundancy":
            return "function identityFailureMessageE Not yet Implemented"
    }
}


type PropNarrower<PropType extends Proposition> = (p: Proposition) => E.Either<ErrorMessage, PropType>

export const checkNegation = (
    possibleNegation: Proposition
): E.Either<ErrorMessage, Negation> => {
    return pipe(
        possibleNegation,
        E.fromPredicate(isNegationProp, typeMisMatchMessage("~"))
    );
};
export const checkConjunction = (
    possibleConjunction: Proposition
): E.Either<ErrorMessage, Conjunction> => {
    return pipe(
        possibleConjunction,
        E.fromPredicate(isConjunctionProp, typeMisMatchMessage("*"))
    );
};
export const checkDisjunction = (
    possibleDisjunction: Proposition
): E.Either<ErrorMessage, Disjunction> => {
    return pipe(
        possibleDisjunction,
        E.fromPredicate(isDisjunctionProp, typeMisMatchMessage("v"))
    );
};
export const checkImplication = (
    possibleImplication: Proposition
): E.Either<ErrorMessage, Implication> => {
    return pipe(
        possibleImplication,
        E.fromPredicate(isImplicationProp, typeMisMatchMessage("->"))
    );
};
const checkEquivalence = (
    possibleEquivalence: Proposition
): E.Either<ErrorMessage, Equivalence> => {
    return pipe(
        possibleEquivalence,
        E.fromPredicate(isEquivalenceProp, typeMisMatchMessage("<->"))
    );
};

const checkNegated = <P extends Proposition>(checkNegated: PropNarrower<P>): PropNarrower<NegationOf<P>> =>
    flow(checkNegation, E.chain(flow(get('prop'), checkNegated, E.map(makeNegation))))

type BinPropShapeValidator<L extends Proposition, OP extends BinOperation, R extends Proposition> = {
    checkLeft: PropNarrower<L>,
    checkOp: PropNarrower<Binary & { operator: OP }>,
    checkRight: PropNarrower<R>,
}


const checkBinaryShape = <L extends Proposition, OP extends BinOperation, R extends Proposition>(
    v: BinPropShapeValidator<L, OP, R>
): PropNarrower<BinaryOf<L, OP, R>> =>
    p => pipe(
        E.Do,
        E.bind('binary', () => v.checkOp(p)),
        E.bind('leftOperand', ({binary}) => v.checkLeft(binary.leftOperand)),
        E.bind('rightOperand', ({binary}) => v.checkRight(binary.rightOperand)),
        E.let(
            'result',
            ({leftOperand, binary, rightOperand}) =>
                ({leftOperand, operator: binary.operator, rightOperand})),
        E.map(get('result'))
    )


function typeMisMatchMessage(op: UnaryOperation | BinOperation): (p: Proposition) => string {
    return p => `'${ShowProp(p)}' is not an ${ShowCompound(op)}`
}

const checkInferenceMP =
    ({
         proposition,
         implication,
         conclusion,
         lineNumbers
     }: Params<'Modus Ponens'>
    ): E.Either<ErrorMessage, InferenceEvent<'Modus Ponens'>> => {
        return pipe(
            E.Do,
            E.let('proposition', () => proposition),
            E.bind('implication', () => checkImplication(implication)),
            E.let('conclusion', () => conclusion),
            E.let('lineNumbers', () => lineNumbers),
            E.let('_rule', rule('Modus Ponens')),
        )
    }

export const checkInferenceMT =
    ({
         negation,
         implication,
         conclusion,
         lineNumbers
     }: Params<'Modus Tollens'>): E.Either<ErrorMessage, InferenceEvent<'Modus Tollens'>> => {
        return pipe(
            E.Do,
            E.bind('implication', () => checkImplication(implication)),
            E.bind('negation', () => checkNegation(negation)),
            E.bind('conclusion', () => checkNegation(conclusion)),
            E.let('lineNumbers', () => lineNumbers),
            E.let('_rule', rule('Modus Tollens'))
        )
    }

export const checkInferenceDS =
    ({
         possibleDisjunction,
         possibleNegatedDisjunct,
         conclusion,
         lineNumbers
     }: Params<'Disjunctive Syllogism'>): E.Either<ErrorMessage, InferenceEvent<'Disjunctive Syllogism'>> => {
        return pipe(
            E.Do,
            E.bind('disjunction', () => checkDisjunction(possibleDisjunction)),
            E.bind('negation', () => checkNegation(possibleNegatedDisjunct)),
            E.let('conclusion', () => conclusion),
            E.let('lineNumbers', () => lineNumbers),
            E.let('_rule', rule('Disjunctive Syllogism'))
        )
    }
const checkInferenceHS:
    (params: Params<'Hypothetical Syllogism'>) => E.Either<ErrorMessage, InferenceEvent<'Hypothetical Syllogism'>>
    = ({firstConditional, secondConditional, conclusion, lineNumbers}) => {
    return pipe(
        E.Do,
        E.bind('firstConditional', () => checkImplication(firstConditional)),
        E.bind('secondConditional', () => checkImplication(secondConditional)),
        E.bind('conclusion', () => checkImplication(conclusion)),
        E.let('lineNumbers', () => lineNumbers),
        E.let('_rule', rule('Hypothetical Syllogism')),
    )
}
const checkInferenceCD:
    (params: Params<'Constructive Dilemma'>) => E.Either<ErrorMessage, InferenceEvent<'Constructive Dilemma'>>
    = ({
           firstConditional,
           secondConditional,
           disjunctionOfAntecedents,
           conclusion,
           lineNumbers
       }) => {
    return pipe(
        E.Do,
        E.bind('disjunctionOfAntecedents', () => checkDisjunction(disjunctionOfAntecedents)),
        E.bind('firstConditional', () => checkImplication(firstConditional)),
        E.bind('secondConditional', () => checkImplication(secondConditional)),
        E.bind('conclusion', () => checkDisjunction(conclusion)),
        E.let('lineNumbers', () => lineNumbers),
        E.let('_rule', rule('Constructive Dilemma'))
    )
}

const checkInferenceSimp:
    (p: Params<'Simplification'>) => E.Either<ErrorMessage, InferenceEvent<'Simplification'>>
    = ({conjunction, conclusion, lineNumbers}) => {
    return pipe(
        E.Do,
        E.bind('conjunction', () => checkConjunction(conjunction)),
        E.let('conclusion', () => conclusion),
        E.let('lineNumbers', () => lineNumbers),
        E.let('_rule', rule('Simplification'))
    )
}
const checkInferenceConj:
    (params: Params<'Conjunction'>) =>
        E.Either<ErrorMessage, InferenceEvent<'Conjunction'>>
    = ({p, q, conclusion, lineNumbers}) => {
    return pipe(
        E.Do,
        E.let('p', () => p),
        E.let('q', () => q),
        E.bind('conclusion', () => checkConjunction(conclusion)),
        E.let('lineNumbers', () => lineNumbers),
        E.let('_rule', rule('Conjunction'))
    )
}

const checkInferenceAdd:
    (params: Params<'Addition'>) =>
        E.Either<ErrorMessage, InferenceEvent<'Addition'>>
    = ({p, conclusion, lineNumbers}) => {
    return pipe(
        E.Do,
        E.let('p', () => p),
        E.bind('conclusion', () => checkDisjunction(conclusion)),
        E.let('lineNumbers', () => lineNumbers),
        E.let('_rule', rule('Addition'))
    )
}


const validateInferenceMP = (
    {proposition, implication, conclusion, _rule, lineNumbers}: InferenceEvent<'Modus Ponens'>
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
        E.let('lineNumbers', () => lineNumbers),
        E.map(validateInference)
    )

export const validateInferenceMT = (
    {negation, implication, conclusion, _rule, lineNumbers}: InferenceEvent<'Modus Tollens'>
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
        E.let('lineNumbers', () => lineNumbers),
        E.let("_rule", rule(_rule)),
        E.map(validateInference)
    )

const isaDisjunctOf = (d: Disjunction): Pred.Predicate<Proposition> => any(matchesLeftOperand(d), matchesRightOperand(d));
const isaConjunctOf = (d: Conjunction): Pred.Predicate<Proposition> => any(matchesLeftOperand(d), matchesRightOperand(d));

const negatedBy = (n: Negation) => (p: Proposition) => pipe(n, getNegated, propIdentity(p))

const performValidationDS = (
    ie: InferenceEvent<'Disjunctive Syllogism'>
): E.Either<ErrorMessage, InferenceEvent<'Disjunctive Syllogism'>> => {
    const {disjunction, negation, conclusion, _rule} = ie
    const isDisjunct = isaDisjunctOf(disjunction)
    return pipe(
        ie,
        E.fromPredicate(
            flow(get('negation'), getNegated, isDisjunct),
            () => `${ShowProp(negation)} doesn't negate either disjunct of ${ShowProp(disjunction)}`
        ),
        E.chain(E.fromPredicate(
            flow(get('conclusion'), all(isDisjunct, Pred.not(negatedBy(negation)))),
            () => "Needs a different message"
        ))
    )
}
const validateInferenceDS = (
    ie: InferenceEvent<'Disjunctive Syllogism'>
): E.Either<ErrorMessage, ValidatedInferenceEvent<'Disjunctive Syllogism'>> => {
    const isDisjunct = isaDisjunctOf(ie.disjunction)
    return pipe(
        E.Do,
        E.bind("negation", () => pipe(
            ie.negation,
            E.fromPredicate(
                flow(getNegated, isDisjunct),
                badNeg => `${ShowProp(badNeg)} doesn't negate either disjunct of ${ShowProp(ie.disjunction)}`
            ),
        )),
        E.bind("conclusion", () => pipe(
            ie.conclusion,
            E.fromPredicate(
                all(isDisjunct, Pred.not(negatedBy(ie.negation))),
                () => ""
            )
        )),
        E.as(ie),
        E.map(validateInference)
    )
}

const validateInferenceAdd = (
    ie: InferenceEvent<'Addition'>
): E.Either<ErrorMessage, ValidatedInferenceEvent<'Addition'>> => {
    return pipe(ie.p,
        E.fromPredicate(
            isaDisjunctOf(ie.conclusion),
            p => `${ShowProp(p)} is not a disjunct of ${ShowProp(ie.conclusion)}`
        ),
        E.as(ie),
        E.map(validateInference)
    )
}

const validateInferenceConj = (
    ie: InferenceEvent<'Conjunction'>
): E.Either<ErrorMessage, ValidatedInferenceEvent<'Conjunction'>> => {
    const notConjunctMssg = (p: Proposition) => `${ShowProp(p)} is not a conjunct of ${ShowProp(ie.conclusion)}`;
    return pipe(
        E.Do,
        E.bind('p', () => pipe(ie.p, E.fromPredicate(isaConjunctOf(ie.conclusion), notConjunctMssg))),
        E.bind('q', () => pipe(ie.q, E.fromPredicate(isaConjunctOf(ie.conclusion), notConjunctMssg))),
        E.as(ie),
        E.map(validateInference)
    )
}

const validateInferenceSimp = (
    ie: InferenceEvent<'Simplification'>
): E.Either<ErrorMessage, ValidatedInferenceEvent<'Simplification'>> => {
    const notConjunctMssg = (p: Proposition) => `${ShowProp(p)} is not a conjunct of ${ShowProp(ie.conclusion)}`;
    return pipe(
        E.Do,
        E.bind('conclusion', () => pipe(ie.conclusion, E.fromPredicate(isaConjunctOf(ie.conjunction), notConjunctMssg))),
        E.as(ie),
        E.map(validateInference)
    )
}

const validateInferenceCD = (
    ie: InferenceEvent<'Constructive Dilemma'>
): E.Either<ErrorMessage, ValidatedInferenceEvent<'Constructive Dilemma'>> => {
    const firstAntecedent = antecedentOf(ie.firstConditional);
    const secondAntecedent = antecedentOf(ie.secondConditional);

    const firstConsequent = consequentOf(ie.firstConditional);
    const secondConsequent = consequentOf(ie.secondConditional);

    const checkDisjunction = () =>
        pipe(ie.disjunctionOfAntecedents,
            E.fromPredicate(
                composedOfComm(firstAntecedent)(secondAntecedent),
                dis =>
                    `${ShowProp(dis)}
                     is not composed of antecedents [
                     ${ShowProp(firstAntecedent)}, ${ShowProp(secondAntecedent)}
                     ]`
            )
        )
    const checkConclusion = () =>
        pipe(ie.conclusion,
            E.fromPredicate(
                composedOfComm(firstConsequent)(secondConsequent),
                dis =>
                    `${ShowProp(dis)}
                     is not composed of consequents [
                     ${ShowProp(firstAntecedent)}, ${ShowProp(secondAntecedent)}
                     ]`
            )
        )

    return pipe(
        E.Do,
        E.bind("checkDisjunction", checkDisjunction),
        E.bind("checkConclusion", checkConclusion),
        E.as(ie),
        E.map(validateInference)
    )
}

const validateInferenceHS = (
    ie: InferenceEvent<'Hypothetical Syllogism'>
): E.Either<ErrorMessage, ValidatedInferenceEvent<'Hypothetical Syllogism'>> => {
    const firstAntecedent = antecedentOf(ie.firstConditional);
    const secondAntecedent = antecedentOf(ie.secondConditional);

    const firstConsequent = consequentOf(ie.firstConditional);
    const secondConsequent = consequentOf(ie.secondConditional);

    const checkConditionals = () =>
        pipe(firstConsequent,
            E.fromPredicate(propIdentity(secondAntecedent),
                fc =>
                    `${ShowProp(fc)} is not the antecedent of ${ShowProp(ie.secondConditional)}`
            )
        )

    const properConclusion = () => makeImplication(firstAntecedent)(secondConsequent);
    const checkConclusion = () =>
        pipe(ie.conclusion,
            E.fromPredicate(
                propIdentity(properConclusion()),
                conc =>
                    `${ShowProp(conc)} is not ${ShowProp(properConclusion())}`
            )
        )

    return pipe(
        E.Do,
        E.bind("checkConditionals", checkConditionals),
        E.bind("checkConclusion", checkConclusion),
        E.as(ie),
        E.map(validateInference)
    )
}

export const validateMP: (p: Params<'Modus Ponens'>) => E.Either<ErrorMessage, ValidatedInferenceEvent<"Modus Ponens">>
    = flow(checkInferenceMP, E.chain(validateInferenceMP))

export const validateMT: (p: Params<'Modus Tollens'>) => E.Either<ErrorMessage, ValidatedInferenceEvent<"Modus Tollens">>
    = flow(checkInferenceMT, E.chain(validateInferenceMT))

export const validateDS: (p: Params<'Disjunctive Syllogism'>) => E.Either<ErrorMessage, ValidatedInferenceEvent<"Disjunctive Syllogism">>
    = flow(checkInferenceDS, E.chain(validateInferenceDS))

export const validateAdd: (p: Params<'Addition'>) => E.Either<ErrorMessage, ValidatedInferenceEvent<"Addition">>
    = flow(checkInferenceAdd, E.chain(validateInferenceAdd))

export const validateConj: (p: Params<'Conjunction'>) => E.Either<ErrorMessage, ValidatedInferenceEvent<"Conjunction">>
    = flow(checkInferenceConj, E.chain(validateInferenceConj))

export const validateSimp: (p: Params<'Simplification'>) => E.Either<ErrorMessage, ValidatedInferenceEvent<"Simplification">>
    = flow(checkInferenceSimp, E.chain(validateInferenceSimp))

export const validateCD: (p: Params<'Constructive Dilemma'>) => E.Either<ErrorMessage, ValidatedInferenceEvent<'Constructive Dilemma'>>
    = flow(checkInferenceCD, E.chain(validateInferenceCD))

export const validateHS: (p: Params<'Hypothetical Syllogism'>) => E.Either<ErrorMessage, ValidatedInferenceEvent<'Hypothetical Syllogism'>>
    = flow(checkInferenceHS, E.chain(validateInferenceHS))


const sameProps = ROA.getEq<Proposition>({
    equals: (p, q) => propIdentity(p)(q)
})


const toRedEvent = (
    {conclusion, _rule, lineNumbers}: EquivalenceParam<'Redundancy'>
): (p: Proposition) => E.Either<ErrorMessage, EquivalenceEvent<'Redundancy'>> => {
    return flow(
        oneOfEithers<Proposition, string, EquivalenceEvent<'Redundancy'>>(
            flow(checkDisjunction,
                E.map(p =>
                    ({tag: 'FromDisRedundancy', conclusion, _rule, lineNumbers, p})
                )
            ),
            flow(checkConjunction,
                E.map(p =>
                    ({tag: 'FromConjRedundancy', conclusion, _rule, lineNumbers, p})
                )
            ),
            p => pipe(conclusion, checkDisjunction, E.map(conclusion =>
                ({tag: 'ToDisRedundancy', conclusion, _rule, lineNumbers, p}))
            ),
            p => pipe(conclusion, checkConjunction, E.map(conclusion =>
                ({tag: 'ToConjRedundancy', conclusion, _rule, lineNumbers, p}))
            )
        ),
        E.mapLeft(ROA.intercalate(S.Monoid)(NewLine))
    )
}


const toMatImpEvent = (
    {conclusion, _rule, lineNumbers}: EquivalenceParam<'Material Implication'>
): (p: Proposition) => E.Either<ErrorMessage, EquivalenceEvent<'Material Implication'>> => {
    const np_q = flow(checkBinaryShape({
        checkLeft: checkNegation,
        checkOp: checkDisjunction,
        checkRight: E.right
    }), IOE.fromEither);

    const p_q = flow(checkImplication, IOE.fromEither)

    return flow(oneOfEithers<Proposition, string, EquivalenceEvent<'Material Implication'>>(
            prop => pipe(
                E.Do,
                E.bind('p', p_q(prop)),
                E.bind('conclusion', np_q(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'ToDisMaterialImplication',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', np_q(prop)),
                E.bind('conclusion', p_q(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'FromDisMaterialImplication',
                    lineNumbers,
                    _rule
                }))
            )
        ),
        E.mapLeft(ROA.intercalate(S.Monoid)(NewLine)))
}

const toMatEqEvent = (
    {conclusion, _rule, lineNumbers}: EquivalenceParam<'Material Equivalence'>
): (p: Proposition) => E.Either<ErrorMessage, EquivalenceEvent<'Material Equivalence'>> => {
    const pq_qp = flow(checkBinaryShape({
        checkLeft: checkImplication,
        checkOp: checkConjunction,
        checkRight: checkImplication
    }), IOE.fromEither)

    const pq_npnq = flow(checkBinaryShape({
        checkLeft: checkConjunction,
        checkOp: checkDisjunction,
        checkRight: checkBinaryShape({
            checkLeft: checkNegation,
            checkOp: checkConjunction,
            checkRight: checkNegation
        }),
    }), IOE.fromEither)

    const p_q = flow(checkEquivalence, IOE.fromEither)

    return flow(oneOfEithers<Proposition, string, EquivalenceEvent<'Material Equivalence'>>(
            prop => pipe(
                E.Do,
                E.bind('p', pq_qp(prop)),
                E.bind('conclusion', p_q(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'FromImpMaterialEquivalence',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', p_q(prop)),
                E.bind('conclusion', pq_qp(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'ToImpMaterialEquivalence',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', pq_npnq(prop)),
                E.bind('conclusion', p_q(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'FromConjMaterialEquivalence',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', p_q(prop)),
                E.bind('conclusion', pq_npnq(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'ToConjMaterialEquivalence',
                    lineNumbers,
                    _rule
                }))
            ),
        ),
        E.mapLeft(ROA.intercalate(S.Monoid)(NewLine)))
}


const toExpEvent = (
    {conclusion, _rule, lineNumbers}: EquivalenceParam<'Exportation'>
): (p: Proposition) => E.Either<ErrorMessage, EquivalenceEvent<'Exportation'>> => {
    const ps_q = flow(checkBinaryShape({
        checkLeft: checkConjunction,
        checkOp: checkImplication,
        checkRight: E.right
    }), IOE.fromEither);

    const p_pq = flow(checkBinaryShape({
        checkLeft: E.right,
        checkOp: checkImplication,
        checkRight: checkImplication
    }), IOE.fromEither)

    return flow(oneOfEithers<Proposition, string, EquivalenceEvent<'Exportation'>>(
            prop => pipe(
                E.Do,
                E.bind('p', ps_q(prop)),
                E.bind('conclusion', p_pq(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'ToExportation',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', p_pq(prop)),
                E.bind('conclusion', ps_q(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'FromExportation',
                    lineNumbers,
                    _rule
                }))
            ),
        ),
        E.mapLeft(ROA.intercalate(S.Monoid)(NewLine)))
}

const toDoubNegEvent = (
    {conclusion, _rule, lineNumbers}: EquivalenceParam<'DoubleNegation'>
): (p: Proposition) => E.Either<ErrorMessage, EquivalenceEvent<'DoubleNegation'>> => {
    const nnp = flow(checkNegated(checkNegation), IOE.fromEither);


    return flow(oneOfEithers<Proposition, string, EquivalenceEvent<'DoubleNegation'>>(
            prop => pipe(
                E.Do,
                E.let('p', () => prop),
                E.bind('conclusion', nnp(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'ToDoubleNegation',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', nnp(prop)),
                E.let('conclusion', () => conclusion),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'FromDoubleNegation',
                    lineNumbers,
                    _rule
                }))
            ),
        ),
        E.mapLeft(ROA.intercalate(S.Monoid)(NewLine)))
}

const toDistEvent = (
    {conclusion, _rule, lineNumbers}: EquivalenceParam<'Distribution'>
): (p: Proposition) => E.Either<ErrorMessage, EquivalenceEvent<'Distribution'>> => {
    const cpd = flow(checkBinaryShape({
        checkLeft: E.right,
        checkOp: checkConjunction,
        checkRight: checkDisjunction
    }), IOE.fromEither)

    const dcc = flow(checkBinaryShape({
        checkLeft: checkConjunction,
        checkOp: checkDisjunction,
        checkRight: checkConjunction
    }), IOE.fromEither)

    const dpc = flow(checkBinaryShape({
        checkLeft: E.right,
        checkOp: checkDisjunction,
        checkRight: checkConjunction
    }), IOE.fromEither)

    const cdd = flow(checkBinaryShape({
        checkLeft: checkDisjunction,
        checkOp: checkConjunction,
        checkRight: checkDisjunction
    }), IOE.fromEither)

    return flow(oneOfEithers<Proposition, string, EquivalenceEvent<'Distribution'>>(
            prop => pipe(
                E.Do,
                E.bind('p', dcc(prop)),
                E.bind('conclusion', cpd(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'ToFactoredConjDistEvent',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', cpd(prop)),
                E.bind('conclusion', dcc(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'FromFactoredConjDistEvent',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', dpc(prop)),
                E.bind('conclusion', cdd(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'FromFactoredDisDistEvent',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', cdd(prop)),
                E.bind('conclusion', dpc(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'ToFactoredDisDistEvent',
                    lineNumbers,
                    _rule
                }))
            )
        ),
        E.mapLeft(ROA.intercalate(S.Monoid)(NewLine)))
}

const toDemorgEvent = (
    {conclusion, _rule, lineNumbers}: EquivalenceParam<'DeMorgans'>
): (p: Proposition) => E.Either<ErrorMessage, EquivalenceEvent<'DeMorgans'>> => {
    const dnn = flow(checkBinaryShape({
        checkLeft: checkNegation,
        checkOp: checkDisjunction,
        checkRight: checkNegation
    }), IOE.fromEither)

    const cnn = flow(checkBinaryShape({
        checkLeft: checkNegation,
        checkOp: checkConjunction,
        checkRight: checkNegation
    }), IOE.fromEither)

    const nd = flow(checkNegated(checkDisjunction), IOE.fromEither)

    const nc = flow(checkNegated(checkConjunction), IOE.fromEither)

    return flow(oneOfEithers<Proposition, string, EquivalenceEvent<'DeMorgans'>>(
            prop => pipe(
                E.Do,
                E.bind('p', dnn(prop)),
                E.bind('conclusion', nc(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'ToNandDeMorgans',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', nc(prop)),
                E.bind('conclusion', dnn(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'FromNandDeMorgans',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', cnn(prop)),
                E.bind('conclusion', nd(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'ToNorDeMorgans',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', nd(prop)),
                E.bind('conclusion', cnn(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'FromNorDeMorgans',
                    lineNumbers,
                    _rule
                }))
            ),
        ),
        E.mapLeft(ROA.intercalate(S.Monoid)(NewLine)))
}

const toContraEvent = (
    {conclusion, _rule, lineNumbers}: EquivalenceParam<'Contraposition'>
): (p: Proposition) => E.Either<ErrorMessage, EquivalenceEvent<'Contraposition'>> => {
    const np_nq = flow(checkBinaryShape({
        checkLeft: checkNegation,
        checkOp: checkImplication,
        checkRight: checkNegation
    }), IOE.fromEither)

    return flow(oneOfEithers<Proposition, string, EquivalenceEvent<'Contraposition'>>(
            prop => pipe(
                E.Do,
                E.bind('p', () => checkImplication(prop)),
                E.bind('conclusion', np_nq(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'NegContrapositionEvent',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', np_nq(prop)),
                E.bind('conclusion', () => checkImplication(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'PosContrapositionEvent',
                    lineNumbers,
                    _rule
                }))
            ),
        ),
        E.mapLeft(ROA.intercalate(S.Monoid)(NewLine)))
}

const toCommEvent = (
    {conclusion, _rule, lineNumbers}: EquivalenceParam<'Commutation'>
): (p: Proposition) => E.Either<ErrorMessage, EquivalenceEvent<'Commutation'>> =>
    flow(oneOfEithers<Proposition, string, EquivalenceEvent<'Commutation'>>(
            prop => pipe(
                E.Do,
                E.bind('p', () => checkDisjunction(prop)),
                E.bind('conclusion', () => checkDisjunction(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'DisjunctiveCommutationEvent',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', () => checkConjunction(prop)),
                E.bind('conclusion', () => checkConjunction(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'ConjunctiveCommutationEvent',
                    lineNumbers,
                    _rule
                }))
            ),
        ),
        E.mapLeft(ROA.intercalate(S.Monoid)(NewLine)))

const toAssocEvent = (
    {conclusion, _rule, lineNumbers}: EquivalenceParam<'Association'>
): (p: Proposition) => E.Either<ErrorMessage, EquivalenceEvent<'Association'>> => {
    const ccp = flow(checkBinaryShape({
        checkLeft: checkConjunction,
        checkOp: checkConjunction,
        checkRight: E.right
    }), IOE.fromEither)

    const cpc = flow(checkBinaryShape({
        checkLeft: E.right,
        checkOp: checkConjunction,
        checkRight: checkConjunction
    }), IOE.fromEither)

    const ddp = flow(checkBinaryShape({
        checkLeft: checkDisjunction,
        checkOp: checkDisjunction,
        checkRight: E.right
    }), IOE.fromEither)

    const dpd = flow(checkBinaryShape({
        checkLeft: E.right,
        checkOp: checkDisjunction,
        checkRight: checkDisjunction
    }), IOE.fromEither)

    return flow(oneOfEithers<Proposition, string, EquivalenceEvent<'Association'>>(
            prop => pipe(
                E.Do,
                E.bind('p', ddp(prop)),
                E.bind('conclusion', dpd(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'ToRightDisjunctiveAssociationEvent',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', dpd(prop)),
                E.bind('conclusion', ddp(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'ToLeftDisjunctiveAssociationEvent',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', ccp(prop)),
                E.bind('conclusion', cpc(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'ToRightConjunctiveAssociationEvent',
                    lineNumbers,
                    _rule
                }))
            ),
            prop => pipe(
                E.Do,
                E.bind('p', cpc(prop)),
                E.bind('conclusion', ccp(conclusion)),
                E.map(({p, conclusion}) => ({
                    p,
                    conclusion,
                    tag: 'ToLeftConjunctiveAssociationEvent',
                    lineNumbers,
                    _rule
                }))
            ),
        ),
        E.mapLeft(ROA.intercalate(S.Monoid)(NewLine)))
}

const toEquivalenceEvent = (params: EquivalenceParams): (p: Proposition) => E.Either<ErrorMessage, EquivalenceEvents> => {
    switch (params._rule) {
        case "Redundancy":
            return toRedEvent(params)
        case "Material Implication":
            return toMatImpEvent(params)
        case "Material Equivalence":
            return toMatEqEvent(params)
        case "Exportation":
            return toExpEvent(params)
        case "DoubleNegation":
            return toDoubNegEvent(params)
        case "Distribution":
            return toDistEvent(params)
        case "DeMorgans":
            return toDemorgEvent(params)
        case "Contraposition":
            return toContraEvent(params)
        case "Commutation":
            return toCommEvent(params)
        case "Association":
            return toAssocEvent(params)
    }
}
const validateRedEvent = (event: EquivalenceEvent<'Redundancy'>): E.Either<ErrorMessage, ValidatedInferenceEvent<'Redundancy'>> => {
    const isBinaryOf = (b: Binary, p: Proposition) =>
        pipe(b,
            E.fromPredicate(composedOf(p)(p),
                (b) =>
                    `Both ${b.leftOperand} and ${b.rightOperand} must be identical to ${p} for a valid application of Redundancy`
            ),
            E.as(validateInference(event))
        )

    switch (event.tag) {
        case "FromConjRedundancy":
            return isBinaryOf(event.p, event.conclusion)
        case "ToConjRedundancy":
            return isBinaryOf(event.conclusion, event.p)
        case "FromDisRedundancy":
            return isBinaryOf(event.p, event.conclusion)
        case "ToDisRedundancy":
            return isBinaryOf(event.conclusion, event.p)
    }
}

const validateMatImpEvent = (event: EquivalenceEvent<'Material Implication'>): E.Either<ErrorMessage, ValidatedInferenceEvent<'Material Implication'>> => {
    const test = (dis: DisjunctionOf<Negation, Proposition>, imp: Implication) => {
        const pq1 = pipe(decompBin(dis), RTUP.mapFst(getNegated));
        const pq2 = decompBin(imp);
        return sameProps.equals(pq1, pq2)
            ? E.right(validateInference(event))
            : E.left(`Material Implication cannot be validly applied to ${dis} and ${imp}`)
    }

    switch (event.tag) {
        case "FromDisMaterialImplication":
            return test(event.p, event.conclusion)
        case "ToDisMaterialImplication":
            return test(event.conclusion, event.p)
    }
}

const validateMatEqEvent = (event: EquivalenceEvent<'Material Equivalence'>): E.Either<ErrorMessage, ValidatedInferenceEvent<'Material Equivalence'>> => {
    const getFailureMessage = identityFailureMessageE(event);
    const validConjME = (
        c: DisjunctionOf<Conjunction, ConjunctionOf<Negation, Negation>>,
        e: Equivalence
    ) => {
        return pipe(decompBinofBin(c),
            RTUP.mapSnd(RTUP.bimap(getNegated, getNegated)),
            E.fromPredicate(applyTup(sameProps.equals), getFailureMessage),
            E.chain(([l, r]) => pipe(
                decompBin(e),
                E.fromPredicate(ps => sameProps.equals(ps, r), getFailureMessage)
            )),
            E.as(validateInference(event))
        )
    }

    const validImpME = (
        c: ConjunctionOf<Implication, Implication>,
        e: Equivalence
    ) => {
        return pipe(decompBinofBin(c),
            E.fromPredicate(applyTup(sameProps.equals), getFailureMessage),
            E.chain(([l, r]) => pipe(
                decompBin(e),
                E.fromPredicate(ps => sameProps.equals(ps, r), getFailureMessage)
            )),
            E.as(validateInference(event))
        )
    }

    switch (event.tag) {
        case "FromConjMaterialEquivalence":
            return validConjME(event.p, event.conclusion)
        case "ToConjMaterialEquivalence":
            return validConjME(event.conclusion, event.p)
        case "FromImpMaterialEquivalence":
            return validImpME(event.p, event.conclusion)
        case "ToImpMaterialEquivalence":
            return validImpME(event.conclusion, event.p)
    }
}

const validateExpEvent = (event: EquivalenceEvent<'Exportation'>): E.Either<ErrorMessage, ValidatedInferenceEvent<'Exportation'>> => {
    const curry = ({leftOperand, rightOperand}: ImplicationOf<Conjunction, Proposition>) =>
        makeImplication(leftOperand.leftOperand)(makeImplication(leftOperand.rightOperand)(rightOperand))

    const checkComponents = (
        conj: ImplicationOf<Conjunction, Proposition>,
        curried: ImplicationOf<Proposition, Implication>
    ) => pipe(conj, curry, E.fromPredicate(propIdentity(curried), identityFailureMessageE(event)), E.as(validateInference(event)))

    switch (event.tag) {
        case "FromExportation":
            return checkComponents(event.conclusion, event.p)
        case "ToExportation":
            return checkComponents(event.p, event.conclusion)
    }
}

const validateDoubNegEvent: (event: EquivalenceEvent<'DoubleNegation'>) => E.Either<ErrorMessage, ValidatedInferenceEvent<'DoubleNegation'>> =
    event => pipe(
        event,
        e => {
            switch (e.tag) {
                case "FromDoubleNegation":
                    return [e.p, e.conclusion] as const
                case "ToDoubleNegation":
                    return [e.conclusion, e.p] as const
            }
        },
        applyTup((nn: NegationOf<Negation>, p: Proposition) => pipe(
            nn,
            getNegated,
            getNegated,
            E.fromPredicate(propIdentity(p), identityFailureMessageE(event)),
            E.as(validateInference(event))
        ))
    )

const validateDistEvent: (e: EquivalenceEvent<'Distribution'>) => E.Either<ErrorMessage, ValidatedInferenceEvent<'Distribution'>>
    = event => pipe(event,
    (e: EquivalenceEvent<'Distribution'>) => {
        switch (e.tag) {
            case "FromFactoredConjDistEvent":
                return [e.conclusion, e.p] as const
            case "FromFactoredDisDistEvent":
                return [e.conclusion, e.p] as const
            case "ToFactoredDisDistEvent":
                return [e.p, e.conclusion] as const
            case "ToFactoredConjDistEvent":
                return [e.p, e.conclusion] as const
        }
    },
    applyTup((bbb: BinaryOf<Binary, Extract<'*' | 'v', BinOperation>, Binary>,
              bpb: BinaryOf<Proposition, Extract<'*' | 'v', BinOperation>, Binary>) => {
        const [[pb, qb], [pc, rb]] = decompBinofBin(bbb)
        const [pa, [qa, ra]] = pipe(decompBin(bpb), RTUP.mapSnd(decompBin))

        const predicate = ROA.every(applyTupC(propIdentity))
        return pipe([
                [pa, pb],
                [pb, pc],
                [qa, qb],
                [ra, rb]
            ] as const,
            E.fromPredicate(predicate, identityFailureMessageE(event)),
            E.as(validateInference(event))
        )
    })
)

const validateDemorgEvent = (event: EquivalenceEvent<'DeMorgans'>): E.Either<ErrorMessage, ValidatedInferenceEvent<'DeMorgans'>> =>
    pipe(event,
        e => {
            switch (e.tag) {
                case "FromNandDeMorgans":
                    return [e.p, e.conclusion] as const
                case "ToNandDeMorgans":
                    return [e.conclusion, e.p] as const
                case "FromNorDeMorgans":
                    return [e.p, e.conclusion] as const
                case "ToNorDeMorgans":
                    return [e.conclusion, e.p] as const
            }
        },
        applyTup((n: NegationOf<Conjunction | Disjunction>, b: BinaryOf<Negation, '*' | 'v', Negation>) => {
            const pq1 = pipe(n, getNegated, decompBin)
            const pq2 = pipe(b, decompBin, RTUP.bimap(getNegated, getNegated))
            return pipe([pq1, pq2] as const,
                E.fromPredicate(applyTup(sameProps.equals), identityFailureMessageE(event)),
                E.as(validateInference(event))
            )
        })
    )

const validateContraEvent = (event: EquivalenceEvent<'Contraposition'>): E.Either<ErrorMessage, ValidatedInferenceEvent<'Contraposition'>> =>
    pipe(event,
        e => {
            switch (e.tag) {
                case "NegContrapositionEvent":
                    return [e.p, e.conclusion] as const
                case "PosContrapositionEvent":
                    return [e.conclusion, e.p] as const
            }
        },
        applyTup((imp: Implication, n: ImplicationOf<Negation, Negation>) => {
            const pq1 = decompBin(imp)
            const pq2 = pipe(n, decompBin, RTUP.bimap(getNegated, getNegated), RTUP.swap)
            return pipe([pq1, pq2] as const,
                E.fromPredicate(applyTup(sameProps.equals), identityFailureMessageE(event)),
                E.as(validateInference(event))
            )
        })
    )

const validateCommEvent = (event: EquivalenceEvent<'Commutation'>): E.Either<ErrorMessage, ValidatedInferenceEvent<'Commutation'>> =>
    pipe(event,
        e => {
            switch (e.tag) {
                case "ConjunctiveCommutationEvent":
                    return [e.p, e.conclusion] as const
                case "DisjunctiveCommutationEvent":
                    return [e.conclusion, e.p] as const
            }
        },
        applyTup((b1: Binary, b2: Binary) => {
            const pq1 = decompBin(b1)
            const pq2 = pipe(b2, decompBin, RTUP.swap)
            return pipe([pq1, pq2] as const,
                E.fromPredicate(applyTup(sameProps.equals), identityFailureMessageE(event)),
                E.as(validateInference(event))
            )
        })
    )

const validateAssocEvent = (event: EquivalenceEvent<'Association'>): E.Either<ErrorMessage, ValidatedInferenceEvent<'Association'>> =>
    pipe(event,
        e => {
            switch (e.tag) {
                case "ToLeftConjunctiveAssociationEvent":
                    return [e.conclusion, e.p] as const
                case "ToLeftDisjunctiveAssociationEvent":
                    return [e.conclusion, e.p] as const
                case "ToRightConjunctiveAssociationEvent":
                    return [e.p, e.conclusion] as const
                case "ToRightDisjunctiveAssociationEvent":
                    return [e.p, e.conclusion] as const
            }
        },
        applyTup((b1: BinaryOf<Binary, BinOperation, Proposition>, b2: BinaryOf<Proposition, BinOperation, Binary>) => {
            const pq1 = pipe(b1,
                decompBin,
                RTUP.mapFst(decompBin),
                ([[p, q], r]) => [p, q, r] as const)
            const pq2 = pipe(b2,
                decompBin,
                RTUP.mapSnd(decompBin),
                ([p, [q, r]]) =>[p, q, r] as const)

            return pipe([pq1, pq2] as const,
                E.fromPredicate(applyTup(sameProps.equals), identityFailureMessageE(event)),
                E.as(validateInference(event))
            )
        })
    )

const validateEquivalenceEvent = (event: EquivalenceEvents): E.Either<ErrorMessage, ValidInferenceEvent> => {
    switch (event._rule) {
        case "Redundancy":
            return validateRedEvent(event)
        case "Material Implication":
            return validateMatImpEvent(event)
        case "Material Equivalence":
            return validateMatEqEvent(event)
        case "Exportation":
            return validateExpEvent(event)
        case "DoubleNegation":
            return validateDoubNegEvent(event)
        case "Distribution":
            return validateDistEvent(event)
        case "DeMorgans":
            return validateDemorgEvent(event)
        case "Contraposition":
            return validateContraEvent(event)
        case "Commutation":
            return validateCommEvent(event)
        case "Association":
            return validateAssocEvent(event)
    }
}

const validateEquivalenceParam = (p: EquivalenceParams) => flow(toEquivalenceEvent(p), E.chain(validateEquivalenceEvent))

export const validateParameter = (p: Parameters): E.Either<ErrorMessage, ValidInferenceEvent> => {
    switch (p._rule) {
        case "Modus Ponens":
            return validateMP(p)
        case "Modus Tollens":
            return validateMT(p)
        case "Disjunctive Syllogism":
            return validateDS(p)
        case "Addition":
            return validateAdd(p)
        case "Conjunction":
            return validateConj(p)
        case "Simplification":
            return validateSimp(p)
        case "Constructive Dilemma":
            return validateCD(p)
        case "Hypothetical Syllogism":
            return validateHS(p)
        case "Redundancy":
        case "Material Implication":
        case "Material Equivalence":
        case "Exportation":
        case "DoubleNegation":
        case "Distribution":
        case "DeMorgans":
        case "Contraposition":
        case "Commutation":
        case "Association":
            return pipe(p.ps,
                traverseArrayLeft(validateEquivalenceParam(p)),
                E.mapLeft(ROA.intercalate(S.Monoid)(NewLine))
            )
    }
}


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


