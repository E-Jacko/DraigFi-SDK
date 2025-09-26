/* src/channel/open.ts
   DraigFi SDK — channel opening & funding
*/

import { createHash } from 'node:crypto'
import { LockingScript } from '@bsv/sdk'

import { getWallet, getIdentityKey, getNetwork } from '@/adapters/wallet/WalletClient'
import { getConfig } from '@/utils'
import type {
  PricingPolicy,
  OpenChannelParams,
  OpenChannelPreview,
  OpenChannelFundResult,
} from './types'

// -------------------------------------
// internals
// -------------------------------------

// default deposit for first on-chain funding (you asked for 1,000 sats)
const DEFAULT_DEPOSIT_SATS = 1_000

// 2-of-2 locking script in ASM (we keep it explicit & readable)
function make2of2Asm(ourKey: string, theirKey: string): string {
  return `OP_2 ${ourKey} ${theirKey} OP_2 OP_CHECKMULTISIG`
}

// short, deterministic channel id derived from the two identity keys
function makeChannelId(ourKey: string, theirKey: string): string {
  const h = createHash('sha256').update(`2of2:${ourKey}:${theirKey}`).digest('hex')
  return h.slice(0, 8)
}

// -------------------------------------
// API
// -------------------------------------

/**
 * Build the 2-of-2 locking script and show the preview
 * (network, channelId, both identity keys, ASM/hex).
 */
export async function openChannelPreview(
  params: OpenChannelParams
): Promise<OpenChannelPreview> {
  await getWallet() // ensures connection, consistent with previous flow

  const netGot = await getNetwork()
  const network = (typeof netGot === 'string' ? netGot : netGot.network) as 'mainnet' | 'testnet'

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
    lockingScriptAsm: locking.toASM(),
  }
}

/**
 * Create the funding transaction (one output to the 2-of-2 script)
 * and store it in the configured wallet basket.
 */
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
    description: `fund payment channel (2-of-2)`,
    outputs: [
      {
        satoshis: deposit,
        lockingScript: locking.toHex(),
        basket: cfg.basketName,
        outputDescription: 'payment-channel funding',
        // attach app-level info; not interpreted by the wallet
        customInstructions: JSON.stringify({ policy: args.policy }),
      },
    ],
    options: { randomizeOutputs: false },
  })

  const out: OpenChannelFundResult = {}
  if (tx) out.tx = tx
  if (signableTransaction?.reference) out.actionReference = signableTransaction.reference
  return out
}

// optional convenience namespace (keeps your existing test ergonomics)
export const openChannel = {
  preview: openChannelPreview,
  fund: openChannelFund,
}
