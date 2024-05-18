import * as E from "fp-ts/Either";
import * as T from 'fp-ts/Task'
import * as TE from "fp-ts/TaskEither";
import * as S from "fp-ts/string"
import * as SET from 'fp-ts/Set'
import * as ROA from "fp-ts/ReadonlyArray"
import * as A from "fp-ts/Array"
import * as PropParser from './Parsing/parsePropositions'
import * as IO from "fp-ts/IO";
import * as PRD from 'fp-ts/Predicate'
import {flip, flow, identity, pipe} from "fp-ts/function";
import {Board} from "./Board/Types";
import {append, inference, toBoard} from "./Board/Board";
import {handleErrorMessage, printTsk} from "./IoTasks/ConsoleIO";
import {solved, stringToDeduction} from "./Board/MappingRefinment/Refinments";
import RL from "readline/promises";
import {printBoardIO, printBoardT} from "./Board/Show/Show";

import {FileContents, readDirContents} from "./IoTasks/FileIO";
import {Branded, TE_traverseSeqArrayLeft} from "./utils";


const problemsDirectory = __dirname + "/Board/Problems";


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

const decideBoard = (b: Board): TE.TaskEither<RejectedBoard, E.Either<ExitRequest, SelectedBoard>> => {
    const wrapSelected = flow(selected, E.right, TE.right)
    const wrapRejected = flow(rejected, TE.left)
    const wrapExit = flow(exitRequest, E.left, TE.right)
    const f = (response: string): TE.TaskEither<RejectedBoard, E.Either<ExitRequest, SelectedBoard>> => {
        return pipe(
            T.Do,
            T.let('boardSelected', () => isYes(response)),
            T.let('boardRejected', () => isNo(response)),
            T.let('exitRequested', () => isExit(response)),
            TE.fromTask,
            TE.chain(({boardSelected, boardRejected, exitRequested}) =>

                exitRequested
                    ? wrapExit()
                    : boardSelected
                        ? wrapSelected(b)
                        : boardRejected
                            ? wrapRejected(b)
                            : decideBoard(b)
            )
        )
    };

    return pipe(
        T.of(b),
        T.tapIO(printBoardIO),
        T.chain(() => getBoardDecision),
        T.chain(f)
    )
}

type ExitRequest = 'Exit';
const exitRequest = (): ExitRequest => 'Exit' as const


const selectBoard: (boards: ReadonlyArray<Board>) => TE.TaskEither<ExitRequest, SelectedBoard>
    = flow(
    TE_traverseSeqArrayLeft(decideBoard),
    TE.fold(
        rejectedBoards => selectBoard(rejectedBoards),
        TE.fromEither
    )
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
        TE.fold(solveBoard, flow(printBoardT, T.tapIO(IO.of(() => rl.close()))))
    )


    return pipe(b,
        printBoardT,
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





