/* close.ts — cooperative close preview (two-sig path, preview only) */

import { LockingScript } from '@bsv/sdk'
import { getIdentityKey } from '@/adapters/wallet/WalletClient'
import { make2of2Asm, makeChannelId } from './ChannelTemplates'
import type { CooperativeClosePreview, OpenChannelParams } from './types'

/**
 * For UX/validation only — shows the redeemScript ASM we expect for a
 * cooperative close. (No signing here — that belongs in Phase 2C.)
 */
export async function cooperativeClosePreview(
  params: OpenChannelParams
): Promise<CooperativeClosePreview> {
  const ourKey   = await getIdentityKey()
  const theirKey = params.theirIdentityKey

  const asm     = make2of2Asm(ourKey, theirKey)
  const locking = LockingScript.fromASM(asm)

  // The actual cooperative spend would be:  OP_0 <sigA> <sigB> <redeemScript>
  // We return the redeemScript (locking) ASM so a caller can confirm we’re
  // constructing the *same* 2-of-2 they expect.
  return {
    channelId: makeChannelId(ourKey, theirKey),
    redeemScriptAsm: locking.toASM(),
  }
}
