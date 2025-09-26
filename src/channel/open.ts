/* open.ts — channel open helpers (preview + fund) */

import { LockingScript } from '@bsv/sdk'
import { getWallet, getIdentityKey, getNetwork } from '@/adapters/wallet/WalletClient'
import { getConfig } from '@/utils'
import { make2of2Asm, makeChannelId } from './ChannelTemplates'
import type {
  OpenChannelParams,
  OpenChannelPreview,
  OpenChannelFundArgs,
  OpenChannelFundResult,
} from './types'

const DEFAULT_DEPOSIT_SATS = 1_000

export async function openChannelPreview(
  params: OpenChannelParams
): Promise<OpenChannelPreview> {
  const net = await getNetwork()
  const network = (typeof net === 'string' ? net : net.network) as 'mainnet' | 'testnet'

  const ourKey   = await getIdentityKey()
  const theirKey = params.theirIdentityKey

  // build script from ASM (no hex parsing here)
  const asm     = make2of2Asm(ourKey, theirKey)
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

export async function openChannelFund(args: OpenChannelFundArgs): Promise<OpenChannelFundResult> {
  const wallet = await getWallet()
  const cfg    = getConfig()

  const ourKey   = await getIdentityKey()
  const theirKey = args.theirIdentityKey

  const asm     = make2of2Asm(ourKey, theirKey)
  const locking = LockingScript.fromASM(asm)

  const deposit = Math.max(1, args.depositSatoshis ?? DEFAULT_DEPOSIT_SATS)

  const { tx, signableTransaction } = await wallet.createAction({
    description: `fund payment channel (2-of-2)`,
    outputs: [{
      satoshis: deposit,
      lockingScript: locking.toHex(),
      basket: cfg.basketName,
      outputDescription: 'payment-channel funding',
      customInstructions: JSON.stringify({ policy: args.policy }),
    }],
    options: { randomizeOutputs: false },
  })

  const out: OpenChannelFundResult = {}
  if (tx) out.tx = tx
  if (signableTransaction?.reference) out.actionReference = signableTransaction.reference
  return out
}
