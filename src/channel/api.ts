/* src/channel/api.ts
   DraigFi SDK — channel API
*/

import { createHash } from 'node:crypto'
import { LockingScript, Transaction, PublicKey } from '@bsv/sdk'

import { getWallet, getIdentityKey, getNetwork } from '@/adapters/wallet/WalletClient'
import { getConfig } from '@/utils'

// ------------------------------
// types
// ------------------------------

export type PricingPolicy = {
  basePricePerUnit: number
  unit: string
}

export type OpenChannelParams = {
  theirIdentityKey: string
}

export type OpenChannelPreview = {
  network: 'mainnet' | 'testnet'
  channelId: string
  ourIdentityKey: string
  theirIdentityKey: string
  lockingScriptHex: string
  lockingScriptAsm: string
}

export type OpenChannelFundResult = {
  tx?: number[]
  actionReference?: string
}

export type RefundPreviewArgs = {
  fundingTx: number[]
  vout: number
  refundAfterSeconds: number
}

export type RefundPreview = {
  lockTime: number
  sequence: number
  funding: {
    vout: number
    satoshis: number
  }
  refundTo: {
    address: string
  }
}

// ------------------------------
// internals
// ------------------------------

const DEFAULT_DEPOSIT_SATS = 1_000 // per request

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
  const wallet = await getWallet()
  const netGot = await getNetwork()
  // getNetwork() can return { network: 'mainnet' } or 'mainnet'
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

export async function openChannelFund(args: OpenChannelParams & {
  depositSatoshis?: number
  policy: PricingPolicy
}): Promise<OpenChannelFundResult> {
  const wallet = await getWallet()
  const cfg = getConfig()

  const ourKey = await getIdentityKey()
  const asm = make2of2Asm(ourKey, args.theirIdentityKey)
  const locking = LockingScript.fromASM(asm)

  const deposit = Math.max(1, args.depositSatoshis ?? DEFAULT_DEPOSIT_SATS)

  const { tx, signableTransaction } = await wallet.createAction({
    description: `fund payment channel (2-of-2)`,
    outputs: [{
      satoshis: deposit,
      lockingScript: locking.toHex(),
      basket: cfg.basketName,
      outputDescription: 'payment-channel funding',
      customInstructions: JSON.stringify({ policy: args.policy })
    }],
    options: { randomizeOutputs: false }
  })

  const out: OpenChannelFundResult = {}
  if (tx) out.tx = tx
  if (signableTransaction?.reference) out.actionReference = signableTransaction.reference
  return out
}

export async function refundPreview(args: RefundPreviewArgs): Promise<RefundPreview> {
  const wallet = await getWallet()
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
      satoshis: Number(out.satoshis ?? 0) // make it definitely a number
    },
    refundTo: { address }
  }
}

// optional object-style namespace
export const openChannel = {
  preview: openChannelPreview,
  fund: openChannelFund,
}
