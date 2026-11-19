// LexoRank for ticket order (lowercase a–z, lexicographic sort).
// null lo/hi = unbounded on that side; null return triggers column reindex.

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

const REINDEX_TOTAL = 26 ** 4;

const encodeBase26_4 = (val: number): string => {
  const chars: string[] = [];
  let rem = val;
  for (let k = 0; k < 4; k++) {
    chars.unshift(String.fromCharCode(FIRST_CODE + (rem % 26)));
    rem = Math.floor(rem / 26);
  }
  return chars.join("");
};

export const generateReindexPositions = (count: number): string[] => {
  if (count === 0) return [];
  if (count === 1) return [`${INITIAL_LEXO_RANK}aaa`];

  const gap = Math.floor(REINDEX_TOTAL / (count + 1));
  return Array.from({ length: count }, (_, idx) =>
    encodeBase26_4((idx + 1) * gap),
  );
};
