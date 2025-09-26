import { createHash } from 'node:crypto'

const COMPRESSED_PUBKEY = /^0[23][0-9a-f]{64}$/i

export function assertCompressedPubKey(hex: string, label: string): void {
  if (!COMPRESSED_PUBKEY.test(hex)) {
    throw new Error(`${label} is not a 33-byte compressed public key hex`)
  }
}

// canonical 2-of-2 multisig asm with our key first
export function make2of2Asm(ourKey: string, theirKey: string): string {
  assertCompressedPubKey(ourKey, 'ourIdentityKey')
  assertCompressedPubKey(theirKey, 'theirIdentityKey')
  return `OP_2 ${ourKey} ${theirKey} OP_2 OP_CHECKMULTISIG`
}

export function makeChannelId(ourKey: string, theirKey: string): string {
  const h = createHash('sha256').update(`2of2:${ourKey}:${theirKey}`).digest('hex')
  return h.slice(0, 8)
}
