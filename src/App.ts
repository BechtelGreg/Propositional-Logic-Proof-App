import * as E from "fp-ts/Either";
import * as T from 'fp-ts/Task'
import * as TE from "fp-ts/TaskEither";
import * as ROA from "fp-ts/ReadonlyArray"
import {Proposition} from "./Propositions/connectives";
import * as Parser from './Parsing/parsePropositions'
import {flow, identity, pipe, flip} from "fp-ts/function";
import {ParserError} from "./Parsing/Types";
import {Board, ProofLine} from "./Board/Types";
import {append, inference} from "./Board/Board";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import {ErrorMessage} from "./validation/errorstuff";
import {getProblems, handleErrorMessage, printTsk} from "./IoTasks/InputOutput";
import {checkNonEmptyArray, getDeduction, solved} from "./Board/MappingRefinment/Refinments";
import RL from "readline/promises";
import {ShowBoard} from "./Board/Show/Show";
import * as IO from "fp-ts/IO";

const problems = "/home/greg/typescript/functional_programming/Problems/hsExample.txt";


const toBoardComponents: (strings: Array<string>) => E.Either<ErrorMessage | ParserError, readonly [ReadonlyArray<Proposition>, Proposition]>
    = flow(
    ROA.fromArray,
    ROA.map(Parser.parse),
    E.sequenceArray,
    E.chainW(checkNonEmptyArray),
    E.map(RNEA.unappend),
)

const getBoard = pipe(
    getProblems(problems),
    TE.chainW(flow(toBoardComponents, TE.fromEither)),
    TE.map(([ps, prop]) => [ps.map(p => [p, 'Premise'] as ProofLine), prop] as const),
    TE.map(([lines, proofTarget]) => ({lines, proofTarget})),
)

const printBoard: (b: Board) => T.Task<void>
    = flow(ShowBoard.show, printTsk)

const rl = RL.createInterface({
    input: process.stdin,
    output: process.stdout
});



const handleInference
    = (b: Board): T.Task<Board> =>
    pipe(() => rl.question("Enter inferences as `Proposition`, `Rule` n_0, n_1 ... n_k: \n"),
        T.chain(flow(
            getDeduction(b),
            TE.chainEitherK(inference),
            TE.map(append),
            TE.flap(b),
            handleErrorMessage(IO.of(b))
        )),
    )


const solveBoard: (b: Board) => T.Task<void>
    = b =>
    pipe(T.of(b),
        T.tap(printBoard),
        T.chain(handleInference),
        T.chain(flow(
            TE.fromPredicate(solved, identity),
            TE.fold(solveBoard, flow(printBoard, T.tapIO(IO.of(() => rl.close()))))
        ))
    )


const run = pipe(getBoard, TE.fold(printTsk, solveBoard))

rl.on('close', () => {
    console.log("Thanks for using me!")
})

run()




