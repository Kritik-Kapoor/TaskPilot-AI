// LexoRank for ticket order (lowercase a–z, lexicographic sort).
// Keep in sync with server/src/utils/ticketPosition.utils.ts.

const FIRST_CODE = "a".charCodeAt(0);
const LAST_CODE = "z".charCodeAt(0);
const VIRT_LO = FIRST_CODE - 1;
const VIRT_HI = LAST_CODE + 1;

export const INITIAL_LEXO_RANK = "n";

export const getLexoRankBetween = (
  lo: string | null,
  hi: string | null,
): string | null => {
  const loStr = lo ?? "";
  const hiStr = hi ?? "";

  let result = "";
  let i = 0;

  phase1: while (true) {
    const lc = i < loStr.length ? loStr.charCodeAt(i) : VIRT_LO;
    const hc = i < hiStr.length ? hiStr.charCodeAt(i) : VIRT_HI;

    if (lc === hc) {
      result += String.fromCharCode(lc);
      i++;
      continue;
    }

    const mid = Math.floor((lc + hc) / 2);

    if (mid > lc) {
      result += String.fromCharCode(mid);
      return result;
    }

    if (lc < FIRST_CODE) return null;

    result += String.fromCharCode(lc);
    i++;
    break phase1;
  }

  while (true) {
    const lc = i < loStr.length ? loStr.charCodeAt(i) : VIRT_LO;
    const mid = Math.floor((lc + VIRT_HI) / 2);

    if (mid > lc) {
      result += String.fromCharCode(mid);
      return result;
    }

    result += String.fromCharCode(lc);
    i++;
  }
};

export const getAppendLexoRank = (maxRank: string | null): string => {
  if (maxRank === null) return INITIAL_LEXO_RANK;
  return getLexoRankBetween(maxRank, null) ?? maxRank + INITIAL_LEXO_RANK;
};

export const compareLexoRank = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;
