import * as E from "fp-ts/Either";
import * as T from 'fp-ts/Task'
import * as TE from "fp-ts/TaskEither";
import * as S from "fp-ts/string"
import * as SET from 'fp-ts/Set'
import * as ROA from "fp-ts/ReadonlyArray"
import * as A from "fp-ts/Array"
import * as PropParser from './Parsing/parsePropositions'
import * as IO from "fp-ts/IO";
import * as ROTUP from 'fp-ts/ReadonlyTuple'
import * as PRD from 'fp-ts/Predicate'
import {flip, flow, identity, pipe} from "fp-ts/function";
import {Board} from "./Board/Types";
import {append, inference, toBoard} from "./Board/Board";
import {handleErrorMessage, printTsk} from "./IoTasks/ConsoleIO";
import {stringToDeduction, solved} from "./Board/MappingRefinment/Refinments";
import RL from "readline/promises";
import {ShowBoard} from "./Board/Show/Show";

import {FileContents, readDirContents} from "./IoTasks/FileIO";
import {Branded, pair, persistParam} from "./utils";


const problemsDirectory = __dirname + "/Problems";


const toPropStrs: (s: ReadonlyArray<FileContents>) => ReadonlyArray<ReadonlyArray<string>> = ROA.map(flow(
    s => s.replace(/(\r\n|\n|\r)/gm, ""),
    s => s.split(',')
))

const getBoards = pipe(
    problemsDirectory,
    readDirContents,
    TE.chainEitherKW(flow(
        toPropStrs,
        E.traverseArray(E.traverseArray(PropParser.parse)),
        E.chain(E.traverseArray(toBoard))
    )),
)


const printBoard: (b: Board) => T.Task<void>
    = flow(ShowBoard.show, printTsk)

const rl = RL.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
}).on('close', () => {
    console.log("Thanks for using me!")
})

const caseInsensitiveSet = flow(
    A.flatMap((s: string) => [S.toLowerCase(s), s, S.toUpperCase(s)]),
    SET.fromArray(S.Eq)
)

const exit = caseInsensitiveSet(['Exit', 'Close'])

const yes = caseInsensitiveSet(['Yes', 'y'])

const no = caseInsensitiveSet(['No', 'n'])

const elemOf: (set: Set<string>) => (s: string) => boolean
    = flip(SET.elem(S.Eq));

const isExit: (s: string) => boolean
    = elemOf(exit)
const isYes: (s: string) => boolean
    = elemOf(yes)
const isNo: (s: string) => boolean
    = elemOf(no)

const getBoardDecision: T.Task<string> = () => rl.question("Would you like to attempt this board? (y/n) ")
type RejectedBoard = Board & Branded<Board, 'RejectedBoard'>
const rejected = (b: Board) => b as RejectedBoard
type SelectedBoard = Board & Branded<Board, 'SelectedBoard'>
const selected = (b: Board) => b as SelectedBoard

const decideBoard = (b: Board): TE.TaskEither<ExitRequest, TE.TaskEither<RejectedBoard, SelectedBoard>> => {
    const wrapSelected = flow(selected, TE.right, TE.right)
    const wrapRejected = flow(rejected, TE.left, TE.right)
    const getWrappedExit = flow(exitRequest, TE.left)
    return pipe(
        T.Do,
        T.bind('void', () => printTsk(ShowBoard.show(b))),
        T.bind('response', () => getBoardDecision),
        T.let('boardSelected', ({response}) => isYes(response)),
        T.let('boardRejected', ({response}) => isNo(response)),
        T.let('exitRequested', ({response}) => isExit(response)),
        TE.fromTask,
        TE.chain(({boardSelected, boardRejected, exitRequested}) =>
            exitRequested
                ? getWrappedExit()
                : boardSelected
                    ? wrapSelected(b)
                    : boardRejected
                        ? wrapRejected(b)
                        : decideBoard(b)
        )
    );
}

type ExitRequest = 'Exit';
const exitRequest = (): ExitRequest => 'Exit' as const

const selectBoard = (boards: ReadonlyArray<Board>): TE.TaskEither<ExitRequest, SelectedBoard> => pipe(
    boards,
    ROA.map(decideBoard),
    TE.sequenceSeqArray,

    TE.chain(flow(
        ROA.map(TE.swap),
        TE.sequenceSeqArray,
        TE.swap,
        TE.fold(selectBoard, TE.right)
    )),
)

const closeAndExit = flow(printTsk, T.tapIO(IO.of(() => rl.close())))

const handleExit: (consumerTask: (s: string) => T.Task<void>) => (s: string) => T.Task<void>
    = consumerTask => flow(
    TE.fromPredicate(PRD.not(isExit), () => 'Exit' as const),
    TE.fold(closeAndExit, consumerTask)
)

const solveBoard = (b: Board): T.Task<void> => {

    const handleDeduction: (s: string) => T.Task<Board> = flow(
        stringToDeduction(b),
        TE.chainEitherK(inference),
        TE.map(append),
        TE.flap(b),
        handleErrorMessage(IO.of(b))
    )

    const recursiveStep: (b: Board) => T.Task<void> = flow(
        TE.fromPredicate(solved, identity),
        TE.fold(solveBoard, flow(printBoard, T.tapIO(IO.of(() => rl.close()))))
    )


    return pipe(b,
        printBoard,
        T.chain(() => () => rl.question("Enter inferences as `Proposition`, `Rule` n_0, n_1 ... n_k: ")),
        T.chain(handleExit(flow(
            handleDeduction,
            T.chain(recursiveStep)
        )))
    )
}

const runProgram = pipe(
    getBoards,
    TE.fold(
        printTsk,
        flow(
            selectBoard,
            TE.fold(closeAndExit, solveBoard)
        )
    )
)

runProgram()





