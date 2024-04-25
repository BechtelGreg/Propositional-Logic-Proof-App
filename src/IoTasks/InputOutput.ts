import {flow, pipe} from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import fs from "fs/promises";
import * as E from "fp-ts/Either";
import * as RL from "readline/promises";

export const readFile = (path: string) =>
    pipe(TE.tryCatch(
            () => fs.readFile(path, "utf8"),
            E.toError
        ),
        TE.map(s => s.split(','))
    )

// const rl = RL.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });

const printStr: (s: string) => T.Task<void>
    = s => T.fromIO(() => console.log(s))

export const print: (s: string | object) => T.Task<void>
    = flow(TE.fromPredicate(
        (s: string | object): s is string => typeof s == 'string',
        JSON.stringify
    ), TE.fold(printStr, printStr)
)

//export const readLine = (s: string): T.Task<string> => () => rl.question(s)
export const getProblems = (problems: string) => readFile(problems)