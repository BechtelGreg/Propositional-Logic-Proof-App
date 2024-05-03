import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import * as ROA from 'fp-ts/ReadonlyArray'
import {flow, pipe} from "fp-ts/function";
import fs from "fs/promises";
import * as E from "fp-ts/Either";
import {ProofLine} from "../Board/Types";
import {Branded} from "../utils";

export type FileName = Branded<string, 'FileName'>
export type FileContents = Branded<string, 'FileContents'>

export const readFile = (path: string): TE.TaskEither<Error, FileContents> => pipe(
    TE.tryCatch(() => fs.readFile(path, "utf8"), E.toError),
    TE.map(s => s as FileContents)
)


const readDir = (dirName: string): TE.TaskEither<Error, ReadonlyArray<FileName>> => pipe(
    TE.tryCatch(() => fs.readdir(dirName), E.toError),
    TE.map(flow(ROA.fromArray, ROA.map(s => s as FileName))),
)

export const readDirContents = (dirName: string): TE.TaskEither<Error, ReadonlyArray<FileContents>> => pipe(
    dirName,
    readDir,
    TE.map(ROA.map(s => `${dirName}/${s}`)),
    TE.chain(TE.traverseArray(readFile))
)

