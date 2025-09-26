/* src/channel/open.ts
   DraigFi SDK — open channel (preview + fund)
*/

import { createHash } from 'node:crypto'
import { LockingScript } from '@bsv/sdk'

import { getWallet, getIdentityKey, getNetwork } from '@/adapters/wallet/WalletClient'
import { getConfig } from '@/utils'
import {
  PricingPolicy,
  OpenChannelParams,
  OpenChannelPreview,
  OpenChannelFundResult
} from './types'

// ------------------------------
// helpers
// ------------------------------

const DEFAULT_DEPOSIT_SATS = 1_000

function make2of2Asm(ourKey: string, theirKey: string): string {
  return `OP_2 ${ourKey} ${theirKey} OP_2 OP_CHECKMULTISIG`
}

function makeChannelId(ourKey: string, theirKey: string): string {
  const h = createHash('sha256').update(`2of2:${ourKey}:${theirKey}`).digest('hex')
  return h.slice(0, 8)
}

// ------------------------------
// API
// ------------------------------

export async function openChannelPreview(
  params: OpenChannelParams
): Promise<OpenChannelPreview> {
  // network can be { network: 'mainnet' } or 'mainnet' depending on wallet
  const netGot = await getNetwork()
  const network = (typeof netGot === 'string' ? netGot : netGot.network) as
    | 'mainnet'
    | 'testnet'

  const ourKey = await getIdentityKey()
  const theirKey = params.theirIdentityKey

  const asm = make2of2Asm(ourKey, theirKey)
  const locking = LockingScript.fromASM(asm)

  return {
    network,
    channelId: makeChannelId(ourKey, theirKey),
    ourIdentityKey: ourKey,
    theirIdentityKey: theirKey,
    lockingScriptHex: locking.toHex(),
    lockingScriptAsm: locking.toASM()
  }
}

export async function openChannelFund(
  args: OpenChannelParams & { depositSatoshis?: number; policy: PricingPolicy }
): Promise<OpenChannelFundResult> {
  const wallet = await getWallet()
  const cfg = getConfig()

  const ourKey = await getIdentityKey()
  const asm = make2of2Asm(ourKey, args.theirIdentityKey)
  const locking = LockingScript.fromASM(asm)

  const deposit = Math.max(1, args.depositSatoshis ?? DEFAULT_DEPOSIT_SATS)

  const { tx, signableTransaction } = await wallet.createAction({
    description: 'fund payment channel (2-of-2)',
    outputs: [
      {
        satoshis: deposit,
        lockingScript: locking.toHex(),
        basket: cfg.basketName,
        outputDescription: 'payment-channel funding',
        customInstructions: JSON.stringify({ policy: args.policy })
      }
    ],
    options: { randomizeOutputs: false }
  })

  const out: OpenChannelFundResult = {}
  if (tx) out.tx = tx
  if (signableTransaction?.reference) out.actionReference = signableTransaction.reference
  return out
}

// optionally keep the object-style namespace for ergonomics
export const openChannel = {
  preview: openChannelPreview,
  fund: openChannelFund
}
