// True when text references Thailand / a Thai destination — used to drop
// Naver blog/cafe matches that are actually about a same-named Korean
// business (e.g. "미금역 필라테스") rather than the Thai venue.
const THAI_RELEVANT =
  /태국|방콕|푸켓|치앙마이|파타야|코사무이|코타오|코팡안|후아힌|끄라비|아오낭|thailand|bangkok|phuket|chiang|pattaya|samui|koh\s|krabi|hua\s*hin|thai/i;

export function isThaiRelevantText(text: string): boolean {
  return THAI_RELEVANT.test(text || "");
}
