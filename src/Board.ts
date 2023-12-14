import {pipe} from "fp-ts/function";
import * as Array from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import * as E from 'fp-ts/Either'
import {get} from "./utils";
import {InferenceRule, Proposition} from "./rulesOfInference";

type Board = {
    lines: Array<Proposition>,
    proofTarget: Proposition
}

type Deduction<R extends InferenceRule> = {
    rule: R,
    lines: Array<number>,
    deducedProp: Proposition
}


const Deduction: <R extends InferenceRule>(rule: R) => (lines: Array<number>) => (deducedProp: Proposition) => E.Either<string, Deduction<R>>
    = rule => lines => deducedProp => ({rule, lines, deducedProp})

const Deduce = <R extends InferenceRule>(d: Deduction<R>) => (b: Board): Board => {
    const g = pipe(
        d,
        get('lines'),
        Array.map(
            E.liftOption(
                O.fromNullableK(b.lines.at),
                i => `No Line ${i} on the board. Valid lines are in range [0, ${d.lines.length})`
            )
        ),
        E.sequenceArray,
        E.map()
    )
    return b
}

const toProp = (brd: Board) => (lines: Array<number>): Record<string, Proposition> => {
    if (lines.length > 0) {
        const [head, ...tail] = lines
        const p = maplines(brd)(tail)
        const k = brd.lines[head]
        return {
            k,
            ...p
        }
    }
    return {}
}


