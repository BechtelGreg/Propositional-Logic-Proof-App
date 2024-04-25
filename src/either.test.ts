
import * as F from 'fp-ts/function'
import {flow, pipe} from "fp-ts/function";
import * as E from 'fp-ts/Either'
import {parseDeductionString} from "./Parsing/parsePropositions";



describe("", () => {
    it("", () => {
        console.log(
            pipe("(P -> (R <-> Q)), Modus Ponens(1, 2)",
                parseDeductionString,
                E.fold(
                    JSON.stringify,
                    JSON.stringify                )
            )
        )
    })
})