import {flow, pipe} from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import * as ROA from "fp-ts/ReadonlyArray"

import {parseDeductionString} from "./Parsing/parsePropositions";
import {printTsk} from "./IoTasks/ConsoleIO";
import RL from "readline/promises";

const rl = RL.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
})

describe('', () => {
    it('Should return an empty string', async () => {
        const f = (n: number): TE.TaskEither<string, TE.TaskEither<boolean, number>> => {
            return pipe(() => rl.question("response: "),
                T.chain(res => {
                    const k = Number(res)
                    if (n < k) {
                        return TE.left(`less than ${k}`)
                    }
                    if (n > k) {
                        return TE.right(TE.left(true))
                    }
                    return TE.right(TE.right(n))
                })
            )
        }

        await pipe(
            [11, 21, 31, 41, 51, 6, 7, 8, 9, 10, 11, 12] as const,
            ROA.map(f),
            TE.sequenceSeqArray,
            TE.fold(printTsk, flow(
                TE.sequenceSeqArray,
                TE.bimap(JSON.stringify, JSON.stringify),
                TE.fold(printTsk, printTsk)
            ))
        )()
    },  700 * 1000)
})

describe("", () => {
    it("", () => {
        console.log(
            pipe("(P -> (R <-> Q)), Modus Ponens(1, 2)",
                parseDeductionString,
                E.fold(
                    JSON.stringify,
                    JSON.stringify)
            )
        )
    })
})