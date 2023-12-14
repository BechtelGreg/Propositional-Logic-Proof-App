import {flow, pipe} from "fp-ts/function";
import * as E from 'fp-ts/Either'
import {string} from "fp-ts";
import {InferenceError} from "./errorstuff";
import {InferenceRule, Params, Proposition} from "./rulesOfInference";


export const get = <T, K extends keyof T>(k: K) => (t: T): T[K] => t[k]

export const composeUsing = <D, A, B, C>(f: (d: D) => (a: A) => B, g: (d: D) => (fn: (a: A) => B) => (a: A) => C): (d: D) => (a: A) => C => {
    return d => pipe(f(d), g(d))
}
export const pair: <A, B>(a: A) => (b: B) => [A, B] = a => b => [a, b]
export const persistParam = <A, B>(f: (a: A) => B) => (a: A): [A, B] => [a, f(a)]
export const persistLeft = <A, B, C>(f: (a: A) => E.Either<B, C>) => (a: A): E.Either<[A, B], C> => pipe(a, f, E.mapLeft(pair(a)))
export const persistRight = <A, B, C>(f: (a: A) => E.Either<B, C>) => (a: A): E.Either<B, [A, C]> => pipe(a, f, E.map(pair(a)))

export const persistEither = <A, B, C>(f: (a: A) => E.Either<B, C>) => (a: A): E.Either<[A, B], [A, C]> => pipe(a, f, E.bimap(pair(a), pair(a)))

export const uncurry: <A, B, C>(f: (a: A) => (b: B) => C) => (p: [A, B]) => C
    = f => ([a, b]) => f(a)(b)


type letters = 'a' | 'b' | 'c'
type Foo<T> = T extends unknown ? {bar: number, name: string, tag: T} : never
type FooLetters = Foo<letters>
