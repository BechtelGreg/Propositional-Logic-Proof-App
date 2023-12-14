import {
    Atomic,
    AtomicProps, Conjunction,
    ConjunctionPDGM, Implication,
    ImplicationPDGM,
    modusPonens,
    ModusPonensParams,
    Proposition,
    ShowProp
} from "./proposition";
import {getRandomChoice} from "./TestUtils";
import * as Random from 'fp-ts/Random'
import * as T from 'fp-ts/Task'
import {pipe} from "fp-ts/function";

describe("Modus Ponens", () => {
    it("should work", () => {

        const validInference = pipe(
            T.fromIO(randomImplication),
            T.map(
                implication => ({
                possibleImplication: implication,
                possibleAntecedent: implication.leftOperand
            })),
            T.map(modusPonens)
        )

        const inValidInference = pipe(
            T.fromIO(randomImplication),
            T.map(
                implication => ({
                    possibleImplication: implication,
                    possibleAntecedent: implication.rightOperand
                })),
            T.map(modusPonens)
        )

        inValidInference().then(console.log)
        validInference().then(console.log)

    })
})

const randomAtomic = Random.randomElem(AtomicProps)
function randomConjunction(): Conjunction {
    return {leftOperand: randomAtomic(), operator: "*", rightOperand: randomAtomic()}
}

function randomImplication(): Implication {
    return {leftOperand: randomAtomic(), operator: "->", rightOperand: randomAtomic()}
}