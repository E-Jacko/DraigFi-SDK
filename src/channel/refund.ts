/* src/channel/refund.ts
   DraigFi SDK — refund preview
*/

import { Transaction, PublicKey } from '@bsv/sdk'
import { getWallet, getIdentityKey } from '@/adapters/wallet/WalletClient'
import { RefundPreviewArgs, RefundPreview } from './types'

export async function refundPreview(args: RefundPreviewArgs): Promise<RefundPreview> {
  await getWallet() // ensures wallet is reachable/ready
  const ourKey = await getIdentityKey()

  const tx = Transaction.fromAtomicBEEF(args.fundingTx)
  const vout = args.vout ?? 0
  const out = tx.outputs[vout]
  if (!out) throw new Error(`funding output ${vout} not found`)

  const lockTime = Math.floor(Date.now() / 1000) + Math.max(1, args.refundAfterSeconds)
  const sequence = 0xfffffffe // non-final to enable nLockTime

  const address = PublicKey.fromString(ourKey).toAddress().toString()

  return {
    lockTime,
    sequence,
    funding: {
      vout,
      satoshis: Number(out.satoshis ?? 0)
    },
    refundTo: { address }
  }
}
