import { Transaction, P2PKH, PublicKey } from '@bsv/sdk'
import { getIdentityKey } from '@/adapters/wallet/WalletClient'

export type RefundPreview = {
  funding: { txid: string; vout: number; satoshis: number }
  refundTo: { publicKey: string; lockingScriptHex: string }
  // absolute (UNIX seconds) locktime we intend to use
  lockTime: number
  // sequence we’ll set on the input so nLockTime is honored
  sequence: number
}

/**
 * Build a *plan* for a refund transaction that spends the funding output
 * back to the buyer after a delay (no signing or broadcast here).
 *
 * - `fundingTx` is the AtomicBEEF (number[]) returned by openChannel.fund
 * - `vout` is the funding output index (default 0)
 * - `refundAfterSeconds` is the relative delay from "now" for locktime
 */
export async function refundPreview(args: {
  fundingTx: number[]
  vout?: number
  refundAfterSeconds?: number
}): Promise<RefundPreview> {
  const vout = args.vout ?? 0
  const refundAfterSeconds = args.refundAfterSeconds ?? 60 * 60 // default 1 hour

  // parse funding tx to discover txid and output value
  const tx = Transaction.fromAtomicBEEF(args.fundingTx)

  // SDK versions differ on the id getter; try a few shapes defensively
  // @ts-ignore
  const txid: string =
    // @ts-ignore
    (typeof tx.id === 'function' ? tx.id('hex') : undefined) ??
    // @ts-ignore
    tx.id ??
    // @ts-ignore
    tx.txid ??
    // @ts-ignore
    (typeof tx.getTxid === 'function' ? tx.getTxid() : 'unknown')

  const out = tx.outputs[vout]
  const satoshis = Number(out?.satoshis ?? 0)

  // build a simple P2PKH refund locking script to our identity key
  const ourPub = await getIdentityKey()
  const refundScriptHex = new P2PKH()
    .lock(PublicKey.fromString(ourPub).toAddress())
    .toHex()

  // nLockTime must be accompanied by a non-final sequence
  const lockTime = Math.floor(Date.now() / 1000) + refundAfterSeconds
  const sequence = 0xfffffffe

  return {
    funding: { txid, vout, satoshis },
    refundTo: { publicKey: ourPub, lockingScriptHex: refundScriptHex },
    lockTime,
    sequence
  }
}
