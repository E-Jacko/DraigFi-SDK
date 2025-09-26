// src/tests/wallet.basket.check.test.ts
import { connectWallet, getWallet } from '@/adapters/wallet/WalletClient'
import { getConfig } from '@/utils'

// simple detector when script hex is available
const looks2of2 = (hex?: string): boolean => {
  if (!hex) return false
  const norm = hex.toLowerCase()
  // OP_2 <pubkey> <pubkey> OP_2 OP_CHECKMULTISIG  => 52 <21..> <21..> 52 ae
  return /^52(?:21[a-f0-9]{66}){2}52ae$/i.test(norm)
}

async function main() {
  await connectWallet()

  const { basketName = 'draigfi' } = getConfig()
  const wallet = await getWallet()
  const deposit = Number(process.env.DRAIGFI_DEPOSIT_SATS ?? 1000)

  const { outputs = [] } = await wallet.listOutputs({ basket: basketName, limit: 25 })

  console.log('basket :', basketName)
  if (outputs.length === 0) {
    console.error('basket empty: no outputs found')
    process.exit(1)
  }

  // try to find the newest output that either:
  // - exposes a 2-of-2 script, or
  // - matches the expected deposit amount (fallback when scripts are hidden)
  const byNewest = [...outputs].sort((a: any, b: any) => (b.blockHeight ?? 0) - (a.blockHeight ?? 0))
  const withScript = byNewest.find(o => looks2of2(o.lockingScript))
  const byAmount  = byNewest.find(o => Number(o.satoshis) === deposit)

  if (withScript) {
    console.log('2-of-2 multisig funding output found:')
    console.log('  outpoint :', withScript.outpoint)
    console.log('  satoshis :', withScript.satoshis)
    console.log('  locking  :', (withScript.lockingScript ?? '').slice(0, 30) + '...')
    return
  }

  if (byAmount) {
    console.log(`no script visible (privacy) — using amount match ${deposit} sats`)
    console.log('  outpoint :', byAmount.outpoint)
    console.log('  satoshis :', byAmount.satoshis)
    return
  }

  console.error('could not find a visible 2-of-2, nor an output with the expected deposit amount')
  outputs.slice(0, 3).forEach((o: any, i: number) => {
    const lockPreview = (o.lockingScript ?? '').slice(0, 20) + '...'
    console.log(`  [sample ${i}]`, { outpoint: o.outpoint, satoshis: o.satoshis, locking: lockPreview })
  })
  process.exit(1)
}

main().catch(err => {
  console.error('basket check failed:', err?.message ?? err)
  process.exit(1)
})
