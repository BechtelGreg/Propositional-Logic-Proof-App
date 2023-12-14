import {pipe, flow, LazyArg} from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import * as E from 'fp-ts/Either'
import * as IO from "fp-ts/IO"
import * as P from "fp-ts/Predicate"
import * as RONEA from "fp-ts/ReadonlyNonEmptyArray";
import * as N from 'fp-ts/number'
import * as Str from 'fp-ts/string'


type IO<T> = IO.IO<T>

import {
    getIntWithinHundredOfZero,
    getRandomString,
    getRandomChoice,
    getRandomChoiceIO,
    PrimitiveType,
    getRandomObject, getRandomInt, getRandomBoolean, getRandomArray
} from "./TestUtils";
import {ReadonlyNonEmptyArray} from "fp-ts/ReadonlyNonEmptyArray";
import {Refinement} from "fp-ts/Refinement";
import {number} from "fp-ts";

describe("Option", () => {

    const getValue: IO<PrimitiveType> = getRandomChoiceIO<PrimitiveType>(
        getRandomInt(-10, 10),
        getRandomString,
        getRandomObject,
        getRandomBoolean
    )

    describe("Combinators", () => {

        describe("tap", () => {
        })
        describe("tapEither", () => {
        })

    })

    describe("Constructors", () => {

        describe("getLeft", () => {
            const value = getValue()
            it("projects the Either to Option: L -> Some, R -> None", () => {

                const some = pipe(value, E.left, O.getLeft)
                const none = pipe(value, E.right, O.getLeft)

                expect(some).toEqual(O.some(value))
                expect(none).toEqual(O.none)
            })
        })
        describe("getRight", () => {
            const value = getValue()
            it("projects the Either to Option: L -> None, R -> Some", () => {
                const none = pipe(value, E.left, O.getRight)
                const some = pipe(value, E.right, O.getRight)

                expect(none).toEqual(O.none)
                expect(some).toEqual(O.some(value))
            })
        })
        describe("none", () => {
            it("has no constructor, and can be used directly as a value", () => {
            })
        })
        describe("of", () => {
            const value = getValue()
            it("constructs an Optional<_T_> for any t: T", () => {
                expect(O.of(value)).toEqual({_tag: "Some", value: value})
            })
        })
        describe("some", () => {
            const value = getValue()
            it("Is the equivalent of 'of'", () => {
                expect(O.some(value)).toEqual(O.of(value))
            })
        })


    })

    describe("Conversions", () => {
        describe("fromEither", () => {
            it("is an alias of 'getRight' as fp_ts Either is Right Biased", () => {
                const value = getValue();
                const none = pipe(value, E.left, O.getRight)
                const some = pipe(value, E.right, O.getRight)

                expect(pipe(value, E.left, O.getRight)).toEqual(pipe(value, E.left, O.fromEither))
                expect(pipe(value, E.right, O.getRight)).toEqual(pipe(value, E.right, O.fromEither))
            })
        })
        describe("fromNullable", () => {
            it("maps actual values to some, otherwise none", () => {
                const value = getValue();
                const some = pipe(value, O.fromNullable)
                const noneFromNull = pipe(null, O.fromNullable)
                const noneFromUndefined = pipe(undefined, O.fromNullable)

                expect(some).toEqual(O.some(value))
                expect(noneFromNull).toEqual(O.none)
                expect(noneFromUndefined).toEqual(O.none)
            })
        })
        describe("toNullable", () => {
            const value = getValue()
            it('should reduce to value', () => {
                expect(pipe(
                    value,
                    O.some,
                    O.toNullable
                )).toEqual(value)
            });

            it('should reduce to null', () => {
                expect(pipe(
                    O.none,
                    O.toNullable
                )).toEqual(null)
            });
        })
        describe("toUndefined", () => {
            const value = getValue()
            it('should reduce to value', () => {
                expect(pipe(
                    value,
                    O.some,
                    O.toUndefined
                )).toEqual(value)
            });

            it('should reduce to undefined', () => {
                expect(pipe(
                    O.none,
                    O.toUndefined
                )).toEqual(undefined)
            });
        })
    })

    describe("do notation", () => {
        describe("Do", () => {
        })
        describe("apS", () => {
        })
        describe("bind", () => {
        })
        describe("bindTo", () => {
        })
        describe("guard", () => {
        })
        describe("let", () => {
        })
    })

    describe("error handling", () => {
        describe("getOrElse", () => {
            const value = getValue()
            it('should reduce to value', () => {
                expect(pipe(
                    value,
                    O.some,
                    O.getOrElse(getValue)
                )).toEqual(value)
            });

            it('should reduce to default', () => {
                const defaultValue = getValue()
                expect(pipe(
                    O.none,
                    O.getOrElse(() => defaultValue)
                )).toEqual(defaultValue)
            });
        })
        describe("getOrElseW", () => {
            const value = getValue()
            const differentKindOfThing = {
                aField: "Wildly different Value"
            }
            it('should reduce to value', () => {
                expect(pipe(
                    value,
                    O.some,
                    O.getOrElseW(() => differentKindOfThing)
                )).toEqual(value)
            });

            it('should reduce to differentKind', () => {
                expect(pipe(
                    O.none,
                    O.getOrElse(() => differentKindOfThing)
                )).toEqual(differentKindOfThing)
            });
        })
        describe("orElse", () => {
            const value = getValue()
            const differentKindOfThing = {
                aField: "Wildly different Value"
            }
            it("reduces to the first Option if the first is Some", () => {
                expect(pipe(
                    value,
                    O.some,
                    O.orElse(() => O.none)
                )).toEqual(O.some(value))
            })

            it("reduces to the second Option if the first is none", () => {
                expect(pipe(
                    O.none,
                    O.orElse(() => O.some(differentKindOfThing))
                )).toEqual(O.some(differentKindOfThing))

                expect(pipe(
                    O.none,
                    O.orElse(() => O.none)
                )).toEqual(O.none)
            })
        })
    })

    describe("filtering", () => {
        describe("compact", () => {
            const value = getValue()
            it("is equivalent to flatten", () => {
                expect(pipe(
                    value,
                    O.some,
                    O.some,
                    O.compact
                )).toEqual(O.some(value))

                expect(pipe(
                    O.none,
                    O.some,
                    O.compact
                )).toEqual(O.none)

                expect(pipe(
                    O.none,
                    O.compact
                )).toEqual(O.none)
            })
        })
        describe("filter", () => {
            const value = getRandomInt(-100, 100)()
            const even = (n: number): boolean => n % 2 === 0
            const odd = P.not(even)
            type NaturalNumber = number & { number_type: 'Natural' }
            const isNatural: Refinement<number, NaturalNumber>
                = (n: number): n is NaturalNumber => Number.isInteger(n) && n >= 0

            it("", () => {
                expect(pipe(
                    1,
                    O.some,
                    O.filter(odd)
                )).toEqual(O.some(1))

                expect(pipe(
                    1,
                    O.some,
                    O.filter(isNatural)
                )).toEqual(O.some(2))
            })


        })
        describe("filterMap", () => {
        })
        describe("partition", () => {
        })
        describe("partitionMap", () => {
        })
        describe("separate", () => {
        })
        describe("wilt", () => {
        })
        describe("wither", () => {
        })
    })


    describe("folding", () => {
        const value = getValue()
        const initial = "initial string"

        describe("foldMap", () => {
            it("maps an option to a monoid", () => {
                const toNumber = O.foldMap(N.MonoidSum);
                expect(pipe(
                    value,
                    O.some,
                    toNumber(flow(JSON.stringify, Str.size))
                )).toEqual(JSON.stringify(value).length)

                expect(pipe(
                    O.none,
                    toNumber(flow(JSON.stringify, Str.size))
                )).toEqual(0)
            })
        })
        describe("reduce", () => {
            it("accumulator given as first arg to binary operation", () => {
                expect(pipe(
                    value,
                    JSON.stringify,
                    O.some,
                    O.reduce(initial, Str.Monoid.concat)
                )).toEqual(initial + JSON.stringify(value))

                expect(pipe(
                    1,
                    O.some,
                    O.reduce(10, N.MonoidSum.concat)
                )).toEqual(11)
            })
        })
        describe("reduceRight", () => {
            it("accumulator given as second arg to binary operation", () => {
                expect(pipe(
                    value,
                    JSON.stringify,
                    O.some,
                    O.reduceRight(initial, Str.Monoid.concat)
                )).toEqual(JSON.stringify(value) + initial)

                expect(pipe(
                    1,
                    O.some,
                    O.reduceRight(10, N.MonoidSum.concat)
                )).toEqual(11)
            })
        })
    })

    describe("instances", () => {
        describe("Alt", () => {
        })
        describe("Alternative", () => {
        })
        describe("Applicative", () => {
        })
        describe("Apply", () => {
        })
        describe("Chain", () => {
        })
        describe("Compactable", () => {
        })
        describe("Extend", () => {
        })
        describe("Filterable", () => {
        })
        describe("Foldable", () => {
        })
        describe("FromEither", () => {
        })
        describe("Functor", () => {
        })
        describe("Monad", () => {
        })
        describe("MonadThrow", () => {
        })
        describe("Pointed", () => {
        })
        describe("Traversable", () => {
        })
        describe("Witherable", () => {
        })
        describe("Zero", () => {
        })
        describe("getEq", () => {
        })
        describe("getMonoid", () => {
        })
        describe("getOrd", () => {
        })
        describe("getShow", () => {
        })
    })

    describe("interop", () => {
        const value = getValue()
        describe("tryCatch", () => {
            const badSupplier: <T>(flag: {shouldThrow: boolean, returnValue: T}) => LazyArg<T> =
                ({shouldThrow, returnValue}) =>
                    () => {
                        if (shouldThrow) {
                            throw new Error()
                        }
                        return returnValue
                    };

            it("works as expected", () => {
                expect(
                    O.tryCatch(badSupplier({shouldThrow: true, returnValue: value}))
                ).toEqual(O.none)

                expect(
                    O.tryCatch(badSupplier({shouldThrow: false, returnValue: value}))
                ).toEqual(O.some(value))
            })

        })
        describe("tryCatchK", () => {
            // just the same really
        })
    })

    describe("lifting", () => {
        describe("fromEitherK", () => {
        })
        describe("fromNullableK", () => {
        })
        describe("fromPredicate", () => {
        })
    })

    describe("mapping", () => {
        describe("as", () => {
        })
        describe("asUnit", () => {
            it("", () => {
                console.log(
                    O.asUnit(O.some(1))
                )
            })
        })
        describe("flap", () => {
        })
        describe("map", () => {
        })
    })

    describe("model", () => {
        describe("None", () => {
        })
        describe("Option", () => {
        })
        describe("Some", () => {
        })
    })

    describe("pattern matching", () => {
        describe("fold", () => {
        })
        describe("foldW", () => {
        })
        describe("match", () => {
        })
        describe("matchW", () => {
        })
    })

    describe("refinements", () => {
        describe("isNone", () => {
        })
        describe("isSome", () => {
        })
    })

    describe("sequencing", () => {
        describe("chainEitherK", () => {
        })
        describe("chainNullableK", () => {
        })
        describe("flatMap", () => {
        })
        describe("flatten", () => {
        })
    })

    describe("traversing", () => {
        describe("sequence", () => {
        })
        describe("sequenceArray", () => {
        })
        describe("traverse", () => {
        })
        describe("traverseArray", () => {
        })
        describe("traverseArrayWithIndex", () => {
        })
        describe("traverseReadonlyNonEmptyArrayWithIndex", () => {
        })
    })

    describe("utils", () => {
        describe("ApT", () => {
        })
        describe("ap", () => {
        })
        describe("apFirst", () => {
        })
        describe("apSecond", () => {
        })
        describe("duplicate", () => {
        })
        describe("elem", () => {
        })
        describe("exits", () => {
        })
        describe("extend", () => {
        })
        describe("throwError", () => {
        })
        describe("zero", () => {
        })
    })
})
