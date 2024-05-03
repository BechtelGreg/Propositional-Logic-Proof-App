import {Show} from "fp-ts/Show";
import {flow, pipe} from "fp-ts/function";
import * as ROA from "fp-ts/ReadonlyArray";
import * as S from "fp-ts/string";
import {ShowProp} from "../../Propositions/connectives";
import {Board, Justifications, ProofLine, ProofLineFormater} from "../Types";
import {max} from "fp-ts/Ord";
import * as NUM from "fp-ts/number";
import * as TUP from "fp-ts/ReadonlyTuple";
import {NewLine} from "../../IoTasks/ConsoleIO";

const JustificationOffset = 25
export const ShowProofLine: Show<ProofLine> & ProofLineFormater = {
    offset: JustificationOffset,
    spaces: (pLen) => pipe(
        ROA.replicate(ShowProofLine.offset - pLen, ' '),
        ROA.reduce(S.Monoid.empty, S.Monoid.concat)
    ),
    show: flow(
        ([p, j]) => [ShowProp(p), ShowJustification.show(j)] as const,
        ([pstr, jstr]) => [pstr, ShowProofLine.spaces(pstr.length), jstr],
        ([pstr, spacestr, jstr]) => `${pstr},${spacestr}${jstr}`
    ),
}
const ShowJustification: Show<Justifications | 'Premise'> = {
    show: j => typeof j == 'string'
        ? j
        : `${j._rule}(${pipe(j.lines, ROA.map(n => `${n}`), ROA.intercalate(S.Monoid)(', '))})`
}


const maxVal = max(NUM.Ord);
const maxLength = (mx: number, s: string) => maxVal(mx, s.length);
const dashes: (lines: ReadonlyArray<string>) => string = flow(
    ROA.reduce(-1, maxLength),
    mx => ROA.replicate(mx, '-'),
    ROA.reduce(S.Monoid.empty, S.Monoid.concat)
)
export const ShowBoard: Show<Board> = {
    show: b => pipe(
        b.lines,
        ROA.mapWithIndex((i, l) => `${i}. ${ShowProofLine.show(l)}${NewLine}`),
        lines => [lines, dashes(lines)] as const,
        flow(TUP.mapFst(ROA.reduce(S.Monoid.empty, S.Monoid.concat))),
        ([lines, dshs]) =>
`${dshs}
        Proof Target: ${ShowProp(b.proofTarget)}
${dshs}
${lines}`
    )
}