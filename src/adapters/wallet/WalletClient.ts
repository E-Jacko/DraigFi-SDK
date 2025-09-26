// src/adapters/wallet/WalletClient.ts
import { WalletClient as BsvWallet } from '@bsv/sdk'
import type { PubKeyHex } from '@bsv/sdk'
import { getConfig } from '../../utils'

// keep one wallet instance for the whole process
let _wallet: BsvWallet | null = null

// minimal wrapper so we can control defaults (originator, auto transport)
export async function connectWallet(): Promise<BsvWallet> {
  if (_wallet) return _wallet

  const { originator } = getConfig()
  // 'auto' chooses the first available comms substrate (window.CWI, XDM, HTTP wire, etc.)
  _wallet = new BsvWallet('auto', originator)
  // just call a lightweight method to force-connect and verify a substrate is live
  await _wallet.getVersion({})
  return _wallet
}

// expose the existing connected instance (throws if not connected yet)
export function getWallet(): BsvWallet {
  if (!_wallet) throw new Error('wallet not connected yet. call connectWallet() first.')
  return _wallet
}

export async function getIdentityKey(): Promise<PubKeyHex> {
  const w = await connectWallet()
  const { publicKey } = await w.getPublicKey({ identityKey: true })
  return publicKey
}

export async function getNetwork(): Promise<{ network: 'mainnet' | 'testnet' }> {
  const w = await connectWallet()
  return await w.getNetwork({})
}
