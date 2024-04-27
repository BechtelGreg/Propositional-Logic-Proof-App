import {flow, identity, pipe} from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import * as IO from "fp-ts/IO";
import * as IOE from "fp-ts/IOEither";
import fs from "fs/promises";
import * as E from "fp-ts/Either";
import * as RL from "readline/promises";
import * as PR from "../PrimitiveRefinements";
import {ErrorMessage} from "../validation/errorstuff";

export const readFile = (path: string): TE.TaskEither<Error, Array<string>> =>
    pipe(TE.tryCatch(
            () => fs.readFile(path, "utf8"),
            E.toError
        ),
        TE.map(s => s.replace(/(\r\n|\n|\r)/gm, "")),
        TE.map(s => s.split(','))
    )


export const printStr: (s: string) => IO.IO<void>
    = s => () => console.log(s)

export const print: (s: string | object) => IO.IO<void>
= flow(
    IOE.fromPredicate(PR.stringOrObjectIsString, JSON.stringify),
    IOE.fold(printStr, printStr)
)

export const printStrTsk: (s: string) => T.Task<void>
    = flow(printStr, T.fromIO)

export const printTsk: (s: string | object) => T.Task<void>
    = flow(print, T.fromIO)

//export const readLine = (s: string): T.Task<string> => () => rl.question(s)
export const getProblems = (problems: string) => readFile(problems)


export const handleError: (e: ErrorMessage) =>  IO.IO<void> = print

export const handleErrors = (errs: ReadonlyArray<ErrorMessage>) => {
    return pipe(errs, IO.traverseArray(handleError))
}

export const handleErrorMessage: <R>(getR: IO.IO<R>) => (t: TE.TaskEither<ErrorMessage, R>) => T.Task<R>
    = getR => flow(
    TE.swap,
    TE.tapIO(handleError),
    TE.swap,
    TE.getOrElse(() => T.fromIO(getR))
)