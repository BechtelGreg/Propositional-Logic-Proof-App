import * as E from "fp-ts/Either";
import {Atomic} from "../Propositions/connectives";
import {BinOperation} from "../Propositions/Types";

export type Input = {
    readonly string: string,
    readonly position: number
}

export type ParserError = SingleParserError | ReadonlyArray<ParserError>

export type Parser<T> = (input: Input) => E.Either<ParserError, readonly [T, Input]>

export type SingleParserError = {
    readonly error: string,
    readonly position: number
}

export type WFF =
    | Atomic
    | NegatedWFF
    | CompoundWFF

export type NegatedWFF = ['~', WFF]

export type CompoundWFF = ['(', WFF, BinOperation, WFF, ')']