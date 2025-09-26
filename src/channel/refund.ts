/* src/channel/refund.ts
   DraigFi SDK — refund helpers (previews only for now)
   - refundPreview: preview the absolute‐time lock + where funds would go
   - refundSpendPreview: rough spend preview after timeout (fee estimate etc.)
*/

import { PublicKey } from '@bsv/sdk'
import { getIdentityKey } from '@/adapters/wallet/WalletClient'

// small helper: unix time "now + seconds"
const inSeconds = (s: number) => Math.floor(Date.now() / 1000) + Math.max(1, s)

// NOTE: shapes are intentionally loose; tests cast to `any` while we iterate.
// When we lock the wire format we can export strong types from `src/types`.

type FundingInput = {
  vout: number
  satoshis: number
  lockingScriptHex: string
}

/**
 * preview the refund path (absolute timelock)
 * - does not build a tx; just returns the ingredients consumers care about
 */
export async function refundPreview(args: {
  fundingTx: number[]
  input: FundingInput
  lockTimeSeconds?: number
}) {
  const ourKey = await getIdentityKey()
  const address = PublicKey.fromString(ourKey).toAddress().toString()

  const lockTime = inSeconds(args.lockTimeSeconds ?? 600) // default 10 minutes
  const sequence = 0xfffffffe // enables locktime semantics

  return {
    lockTime,
    sequence,
    funding: {
      vout: args.input.vout,
      satoshis: Number(args.input.satoshis ?? 0)
    },
    refundTo: { address }
  }
}

/**
 * preview spending the refund branch after timeout
 * - rough fee estimate + basic output shape
 * - this is *not* a signed transaction yet
 */
export async function refundSpendPreview(args: {
  fundingTx: number[]
  input: FundingInput
  feeRate?: number // sat/byte
  lockTimeSeconds?: number
}) {
  const ourKey = await getIdentityKey()
  const address = PublicKey.fromString(ourKey).toAddress().toString()

  // toy fee model: ~200 bytes for a simple 2-of-2 refund spend
  const feeRate = Number(args.feeRate ?? 1)
  const estSizeBytes = 200
  const feeEstimate = Math.max(1, Math.floor(feeRate * estSizeBytes))
  const change = Math.max(0, Number(args.input.satoshis ?? 0) - feeEstimate)

  return {
    input: {
      vout: args.input.vout,
      satoshis: Number(args.input.satoshis ?? 0),
      lockingScriptHex: args.input.lockingScriptHex
    },
    outputs: [
      {
        address,
        satoshis: change
      }
    ],
    feeEstimate,
    unlockingShape: '2of2-refund-after-locktime'
  }
}
