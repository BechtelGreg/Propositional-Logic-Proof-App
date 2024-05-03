import {flow, hole, pipe, apply} from "fp-ts/function";
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import * as ROA from 'fp-ts/ReadonlyArray'
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import * as T from "fp-ts/Task";

declare const __brand: unique symbol
type Brand<B> = { [__brand]: B }
export type Branded<T, B> = T & Brand<B>

export type Flatten<T> = T extends ReadonlyArray<infer U> ? Flatten<U> : T
export const pairRO: <A>(a: A) => <B>(b: B) => readonly [A, B]
    = a => b => [a, b] as const

export const get = <T, K extends keyof T>(k: K) => (t: T): T[K] => t[k]

export const applyTup = <L, R, T>(f: (l: L, r: R) => T) => ([l, r]: [L, R] | readonly [L, R]): T => f(l, r)
export const applyTupC = <L, R, T>(f: (l: L) => (r: R) => T) => ([l, r]: [L, R] | readonly [L, R]): T => f(l)(r)

export const pair: <A, B>(a: A) => (b: B) => [A, B] = a => b => [a, b]
export const persistParam = <A, B>(f: (a: A) => B) => (a: A): [B, A] => pair<B, A>(f(a))(a)
export const persistLeft: <A, B, C>(f: (a: A) => E.Either<B, C>) => (a: A) => E.Either<[A, B], C>
    = f => a => pipe(f(a), E.mapLeft(pair(a)))
export const persistRight: <A, B, C>(f: (a: A) => E.Either<B, C>) => (a: A) => E.Either<B, [A, C]>
    = f => a => pipe(a, f, E.map(pair(a)))

export const persistEither: <A, B, C>(f: (a: A) => E.Either<B, C>) => (a: A) => E.Either<[A, B], [A, C]>
    = f => a => pipe(a, f, E.bimap(pair(a), pair(a)))

export const uncurry: <A, B, C>(f: (a: A) => (b: B) => C) => (p: [A, B]) => C
    = f => ([a, b]) => f(a)(b)

export const isWhiteSpace = (s: string) => {
    for (let c of s) {
        if (c !== ' ') {
            return false
        }
    }
    return true
}


export const oneOfEithers = <A, L, R>(
    ...es: ReadonlyArray<(a:A) => E.Either<L, R>>
): (a:A) => E.Either<ReadonlyArray<L>, R> =>
    a => pipe(es, ROA.map(flow(apply(a), E.swap)), E.sequenceArray, E.swap)

export const traverseArrayLeft = <A, L, R>(
    ae: (a:A) => E.Either<L, R>
): (as: ReadonlyArray<A>) => E.Either<ReadonlyArray<L>, R> =>
    flow(ROA.map(flow(ae, E.swap)), E.sequenceArray, E.swap)

export const traverseArrayTLeft = <A, L, R>(
    ae: (a:A) => TE.TaskEither<L, R>
): (as: ReadonlyArray<A>) => TE.TaskEither<ReadonlyArray<L>, R> =>
    flow(ROA.map(flow(ae, TE.swap)), TE.sequenceArray, TE.swap)


const spreadRNEA = <T>(insertElem: T) => (rts: ReadonlyArray<T>): RNEA.ReadonlyNonEmptyArray<RNEA.ReadonlyNonEmptyArray<T>> => {
    return pipe(rts,
        ROA.matchLeft(
            () => [[insertElem]],
            (t: T, ts: ReadonlyArray<T>) =>
                ROA.prepend(
                    pipe(ROA.prepend(t)(ts), ROA.prepend(insertElem))
                )(
                    pipe(spreadRNEA(insertElem)(ts), ROA.map(ROA.prepend(t)))
                )
        ))
}

const toROA = <T>(roneTs: RNEA.ReadonlyNonEmptyArray<T>): ReadonlyArray<T> => roneTs as ReadonlyArray<T>
const spread = <T>(t: T) => flow(spreadRNEA(t), toROA, ROA.map(toROA))
export const permutations: <T>(rts: ReadonlyArray<T>) => ReadonlyArray<ReadonlyArray<T>>
    = ROA.matchLeft(
    () => [[]],
    (t, ts) =>
        pipe(ts,
            permutations,
            ROA.map(spread(t)),
            ROA.flatten))

