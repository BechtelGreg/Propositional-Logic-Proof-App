import {
    Conjunction,
    ConjunctionOf,
    Disjunction,
    DisjunctionOf, Equivalence,
    EquivalenceOf, Implication,
    ImplicationOf, Negation,
    NegationOf
} from "../../Propositions/Types";
import {Proposition} from "../../Propositions/connectives";
import {CitesJustification, EquivalenceRules} from "../rulesOfInference";


export type ToRightDisjunctiveAssociationEvent = {
    tag: 'ToRightDisjunctiveAssociationEvent'
    p: DisjunctionOf<Disjunction, Proposition>,
    conclusion: DisjunctionOf<Proposition, Disjunction>
}

export type ToLeftDisjunctiveAssociationEvent = {
    tag: 'ToLeftDisjunctiveAssociationEvent'
    p: DisjunctionOf<Proposition, Disjunction>,
    conclusion: DisjunctionOf<Disjunction, Proposition>
}

export type ToRightConjunctiveAssociationEvent = {
    tag: 'ToRightConjunctiveAssociationEvent'
    p: ConjunctionOf<Conjunction, Proposition>,
    conclusion: ConjunctionOf<Proposition, Conjunction>
}

export type ToLeftConjunctiveAssociationEvent = {
    tag: 'ToLeftConjunctiveAssociationEvent'
    p: ConjunctionOf<Proposition, Conjunction>,
    conclusion: ConjunctionOf<Conjunction, Proposition>
}

export type DisjunctiveAssociationEvent = ToLeftDisjunctiveAssociationEvent | ToRightDisjunctiveAssociationEvent
export type ConjunctiveAssociationEvent = ToLeftConjunctiveAssociationEvent | ToRightConjunctiveAssociationEvent
export type AssociationEvent = DisjunctiveAssociationEvent | ConjunctiveAssociationEvent



export type DisjunctiveCommutationEvent = {
    tag: 'DisjunctiveCommutationEvent'
    p: Disjunction,
    conclusion: Disjunction
} & CitesJustification<"Commutation">

export type ConjunctiveCommutationEvent = {
    tag: 'ConjunctiveCommutationEvent'
    p: Conjunction,
    conclusion: Conjunction
} & CitesJustification<"Commutation">

export type CommutationEvent = DisjunctiveCommutationEvent | ConjunctiveCommutationEvent



export type NegContrapositionEvent = {
    tag: 'NegContrapositionEvent'
    p: Implication,
    conclusion: ImplicationOf<Negation, Negation>
} & CitesJustification<"Contraposition">

export type PosContrapositionEvent = {
    tag: 'PosContrapositionEvent'
    p: ImplicationOf<Negation, Negation>,
    conclusion: Implication
} & CitesJustification<"Contraposition">

export type ContrapositionEvent = PosContrapositionEvent | NegContrapositionEvent



export type ToNorDeMorgans = {
    tag: 'ToNorDeMorgans',
    p: ConjunctionOf<Negation, Negation>,
    conclusion: NegationOf<Disjunction>
}

export type FromNorDeMorgans = {
    tag: 'FromNorDeMorgans',
    conclusion: ConjunctionOf<Negation, Negation>,
    p: NegationOf<Disjunction>
}

export type ToNandDeMorgans = {
    tag: 'ToNandDeMorgans',
    p: DisjunctionOf<Negation, Negation>,
    conclusion: NegationOf<Conjunction>
}

export type FromNandDeMorgans = {
    tag: 'FromNandDeMorgans',
    conclusion: DisjunctionOf<Negation, Negation>,
    p: NegationOf<Conjunction>
}

export type NandDemorgans = ToNandDeMorgans | FromNandDeMorgans
export type NorDemorgans = ToNorDeMorgans | FromNorDeMorgans
export type DeMorgansEvent = NorDemorgans | NandDemorgans



export type ToFactoredConjDistEvent = {
    tag: 'ToFactoredConjDistEvent',
    p: DisjunctionOf<Conjunction, Conjunction>,
    conclusion: ConjunctionOf<Proposition, Disjunction>
}

export type FromFactoredConjDistEvent = {
    tag: 'FromFactoredConjDistEvent',
    p: ConjunctionOf<Proposition, Disjunction>,
    conclusion: DisjunctionOf<Conjunction, Conjunction>,
}

export type ToFactoredDisDistEvent = {
    tag: 'ToFactoredDisDistEvent',
    p: ConjunctionOf<Disjunction, Disjunction>,
    conclusion: DisjunctionOf<Proposition, Conjunction>,
}

export type FromFactoredDisDistEvent = {
    tag: 'FromFactoredDisDistEvent',
    p: DisjunctionOf<Proposition, Conjunction>,
    conclusion: ConjunctionOf<Disjunction, Disjunction>,
}


export type ConjDistributionEvent = ToFactoredConjDistEvent | FromFactoredConjDistEvent
export type DisDistributionEvent = ToFactoredDisDistEvent | FromFactoredDisDistEvent
export type DistributionEvent = ConjDistributionEvent | DisDistributionEvent



export type ToDoubleNegation = {
    tag: 'ToDoubleNegation',
    p: Proposition
    conclusion: NegationOf<Negation>
}
export type FromDoubleNegation = {
    tag: 'FromDoubleNegation',
    p: NegationOf<Negation>,
    conclusion: Proposition
}
export type DoubleNegation = ToDoubleNegation | FromDoubleNegation



export type ToExportation = {
    tag: 'ToExportation',
    p: ImplicationOf<Conjunction, Proposition>,
    conclusion: ImplicationOf<Proposition, Implication>
}
export type FromExportation = {
    tag: 'FromExportation',
    p: ImplicationOf<Proposition, Implication>,
    conclusion: ImplicationOf<Conjunction, Proposition>
}
export type Exportation = ToExportation | FromExportation



export type ToConjMaterialEquivalence = {
    tag: 'ToConjMaterialEquivalence',
    p: Equivalence,
    conclusion: DisjunctionOf<Conjunction, ConjunctionOf<Negation, Negation>>
}

export type FromConjMaterialEquivalence = {
    tag: 'FromConjMaterialEquivalence',
    p: DisjunctionOf<Conjunction, ConjunctionOf<Negation, Negation>>,
    conclusion: Equivalence
}

export type ConjMaterialEquivalence = ToConjMaterialEquivalence | FromConjMaterialEquivalence

export type ToImpMaterialEquivalence = {
    tag: 'ToImpMaterialEquivalence',
    p: Equivalence,
    conclusion: ConjunctionOf<Implication, Implication>
}

export type FromImpMaterialEquivalence = {
    tag: 'FromImpMaterialEquivalence',
    p: ConjunctionOf<Implication, Implication>,
    conclusion: Equivalence,
}

export type ImpMaterialEquivalence = ToImpMaterialEquivalence | FromImpMaterialEquivalence
export type MaterialEquivalence = ConjMaterialEquivalence | ImpMaterialEquivalence



export type ToDisMaterialImplication = {
    tag: 'ToDisMaterialImplication',
    p: Implication
    conclusion: DisjunctionOf<Negation, Proposition>
}

export type FromDisMaterialImplication = {
    tag: 'FromDisMaterialImplication',
    p: DisjunctionOf<Negation, Proposition>,
    conclusion: Implication
}

export type MaterialImplication = ToDisMaterialImplication | FromDisMaterialImplication



export type ToConjRedundancy = {
    tag: 'ToConjRedundancy',
    p: Proposition,
    conclusion: Conjunction,
}

export type FromConjRedundancy = {
    tag: 'FromConjRedundancy',
    p: Conjunction,
    conclusion: Proposition
}

export type ConjRedundancy = ToConjRedundancy | FromConjRedundancy

export type ToDisRedundancy = {
    tag: 'ToDisRedundancy',
    p: Proposition,
    conclusion: Disjunction,
}

export type FromDisRedundancy = {
    tag: 'FromDisRedundancy',
    p: Disjunction,
    conclusion: Proposition
}

export type DisRedundancy = ToDisRedundancy | FromDisRedundancy
export type Redundancy = ConjRedundancy | DisRedundancy



export type EquivalenceEvents =
    | (AssociationEvent & CitesJustification<"Association">)
    | (CommutationEvent & CitesJustification<'Commutation'>)
    | (ContrapositionEvent & CitesJustification<'Contraposition'>)
    | (DeMorgansEvent & CitesJustification<'DeMorgans'>)
    | (DistributionEvent & CitesJustification<'Distribution'>)
    | (DoubleNegation & CitesJustification<'DoubleNegation'>)
    | (Exportation & CitesJustification<"Exportation">)
    | (MaterialEquivalence & CitesJustification<"Material Equivalence">)
    | (MaterialImplication & CitesJustification<"Material Implication">)
    | (Redundancy & CitesJustification<"Redundancy">)

export type EquivalenceEvent<R extends EquivalenceRules> = Extract<EquivalenceEvents, { _rule: R }>