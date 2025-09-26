// src/channel/keyUtils.ts
// helpers for BRC-100 wallet interop: pubkey normalization + 2-of-2 script utilities

import { LockingScript } from "@bsv/sdk";

// -- pubkey normalization / validation ---------------------------------------

export function normalizePubKeyHex(input: string): string {
  // trims, strips leading 0x, lowercases
  const s = (input ?? "").trim().replace(/^0x/i, "");
  return s.toLowerCase();
}

export function isCompressedPubKeyHex(s: string): boolean {
  // 33-byte SEC-compressed key: 0x02/0x03 + 32-byte X coord
  // => 66 hex chars, starts with 02 or 03
  return /^(02|03)[0-9a-f]{64}$/.test(s);
}

// -- deterministic 2-of-2 builder (order-agnostic across wallets) ------------

export function make2of2AsmDeterministic(a: string, b: string): string {
  const A = normalizePubKeyHex(a);
  const B = normalizePubKeyHex(b);
  const [k1, k2] = [A, B].sort(); // stable order regardless of "ours/theirs"
  return `OP_2 ${k1} ${k2} OP_2 OP_CHECKMULTISIG`;
}

export function make2of2HexFromAsm(asm: string): string {
  return LockingScript.fromASM(asm).toHex();
}

// -- lenient detectors / parsers ---------------------------------------------

export function isTwoOfTwoAsm(asm?: string): boolean {
  if (!asm) return false;
  const s = asm.trim();
  return /^OP_2\s+[0-9a-f]{66}\s+[0-9a-f]{66}\s+OP_2\s+OP_CHECKMULTISIG$/i.test(s);
}

export function parseTwoKeysFromAsm(asm?: string): string[] | null {
  if (!asm) return null;
  const m = asm
    .trim()
    .match(/^OP_2\s+([0-9a-f]{66})\s+([0-9a-f]{66})\s+OP_2\s+OP_CHECKMULTISIG$/i);
  if (!m) return null;
  const keys = [normalizePubKeyHex(m[1]), normalizePubKeyHex(m[2])].sort();
  return keys;
}

// -- comparisons --------------------------------------------------------------

export function scriptsEqualExactHex(aHex?: string, bHex?: string): boolean {
  if (!aHex || !bHex) return false;
  return aHex.toLowerCase() === bHex.toLowerCase();
}

export function scriptsEqualIgnoringKeyOrder(aAsm?: string, bAsm?: string): boolean {
  const A = parseTwoKeysFromAsm(aAsm ?? "");
  const B = parseTwoKeysFromAsm(bAsm ?? "");
  if (!A || !B) return false;
  return A[0] === B[0] && A[1] === B[1];
}

// pretty diff for logs (dev-only)
export function prettyScriptDiff(aAsm?: string, bAsm?: string): string {
  if (!aAsm || !bAsm) return "one side missing ASM";
  const A = parseTwoKeysFromAsm(aAsm);
  const B = parseTwoKeysFromAsm(bAsm);
  if (!A || !B) return "one side is not recognized as 2-of-2";
  const lines: string[] = [];
  lines.push("keys (A):", A.join(" , "));
  lines.push("keys (B):", B.join(" , "));
  if (A[0] !== B[0] || A[1] !== B[1]) lines.push("NOTE: keys differ (order or values)");
  if (aAsm.trim().toLowerCase() !== bAsm.trim().toLowerCase())
    lines.push("NOTE: ASM differs byte-for-byte");
  return lines.join("\n");
}
