/* src/channel/refund.ts
   DraigFi SDK — refund (timeout) preview
*/

import { Transaction, PublicKey } from '@bsv/sdk'
import { getWallet, getIdentityKey } from '@/adapters/wallet/WalletClient'
import type { RefundPreviewArgs, RefundPreview } from './types'

// -------------------------------------
// API
// -------------------------------------

/**
 * Build a refund *preview* for a previously-created funding output.
 * - lockTime is `now + refundAfterSeconds` (seconds-based)
 * - sequence uses `0xfffffffe` (signals opt-in to lockTime)
 * - refundTo is our own P2PKH address (from identity key)
 *
 * NOTE: This only previews parameters for the future refund tx.
 * The actual refund transaction will be constructed in a later phase.
 */
export async function refundPreview(args: RefundPreviewArgs): Promise<RefundPreview> {
  await getWallet() // ensure wallet connection (consistent developer experience)
  const ourKey = await getIdentityKey()

  const tx = Transaction.fromAtomicBEEF(args.fundingTx)
  const vout = args.vout ?? 0
  const out = tx.outputs[vout]
  if (!out) throw new Error(`funding output ${vout} not found`)

  const lockTime = Math.floor(Date.now() / 1000) + Math.max(1, args.refundAfterSeconds)
  const sequence = 0xfffffffe

  const address = PublicKey.fromString(ourKey).toAddress().toString()

  return {
    lockTime,
    sequence,
    funding: {
      vout,
      satoshis: Number(out.satoshis ?? 0),
    },
    refundTo: { address },
  }
}
