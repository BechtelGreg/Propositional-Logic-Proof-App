import * as Random from "fp-ts/Random";
import * as IO from "fp-ts/IO"
import * as RONEA from "fp-ts/ReadonlyNonEmptyArray";
import {reduce} from "fp-ts/Foldable";
import * as STR from "fp-ts/string"
import * as ARR from "fp-ts/Array";
import {pipe, flow, untupled, flip} from "fp-ts/function";

type IO<T> = IO.IO<T>
type ReadonlyNonEmptyArray<T> = RONEA.ReadonlyNonEmptyArray<T>
type char = string & {length: 1}
export const getRandomChoice: <A>(...rest: ReadonlyNonEmptyArray<A>) => IO<A>
    = untupled(Random.randomElem)

export const getRandomChoiceIO: <A>(...rest: ReadonlyNonEmptyArray<IO<A>>) => IO<A>
    = flow(getRandomChoice, IO.flatten)
export const getIntWithinHundredOfZero = Random.randomInt(-100, 100);

export const getRandomInt = Random.randomInt

export const getRandomReal: IO<number> = () => Random.random() * getRandomInt(1, 100)()

const charSet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

const chars = STR.split('')(charSet) as ReadonlyNonEmptyArray<char>
export const randomChar = Random.randomElem(chars)

const nArrayRandomChars = (n: number): Array<char> => ARR.makeBy(n, randomChar)
export const getRandomString: IO<string> = flow(
    Random.randomInt(0, charSet.length - 1),
    nArrayRandomChars,
    ARR.reduce(STR.Monoid.empty, STR.Monoid.concat)
)

export const getRandomBoolean: IO<boolean> = Random.randomBool;
export const getRandomObject: IO<object> = () => randomObject(3, {})

export const getRandomArray = <T>(length: number, generator: (n: number) => T): IO<Array<T>> =>
    () => ARR.makeBy(length, generator)

function randomObject(n: number, obj: object): object {
    if (n <= 0) {
        return obj;
    }

    let randomBool = getRandomBoolean();
    if (randomBool) {
        return {
            someString: getRandomString(),
            someInt: getIntWithinHundredOfZero(),
            someReal: getRandomReal(),
            anObj: {...obj},
            anotherObj: randomObject(n - 1, obj),
            aBoolean: getRandomBoolean()
        };
    } else {
        return {
            anArray: ARR.makeBy(
                getRandomInt(0, 3)(),
                n => randomObject(n - 1, obj)
            )
        };
    }
}

/*
           cont getRandObjectArray: IO<Array<object>> = flow(
                getRandomInt(0, 10),
                n => getRandomArray(n, getRandomObject)
            )
 */

export type PrimitiveType = string | number | object | boolean | bigint | symbol | undefined | null


