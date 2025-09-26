// src/tests/wallet.basket.check.test.ts
import { connectWallet, getWallet } from '../adapters/wallet/WalletClient'
import { getConfig } from '../utils'

// safe 2-of-2 detector (handles undefined)
const is2of2 = (hex?: string): boolean => {
  if (!hex) return false
  const norm = hex.toLowerCase()
  return /^52(?:21[a-f0-9]{66}){2}52ae$/i.test(norm)
}

async function main() {
  // ensure we’re connected to Metanet Desktop for this process
  await connectWallet()

  const { basketName = 'draigfi' } = getConfig()
  const wallet = await getWallet()

  const { outputs = [] } = await wallet.listOutputs({
    basket: basketName,
    limit: 25,
  })

  if (outputs.length === 0) {
    console.error('basket empty: no outputs found')
    process.exit(1)
  }

  // pick newest output that matches 2-of-2 (or just show a couple for debugging)
  const funding = outputs.find(o => is2of2(o.lockingScript))

  console.log('basket :', basketName)

  if (!funding) {
    console.error('no 2-of-2 multisig funding output found in basket')
    outputs.slice(0, 3).forEach((o, i) => {
      const lockPreview = (o.lockingScript ?? '').slice(0, 20) + '...'
      console.log(`  [sample ${i}]`, {
        outpoint: o.outpoint,
        satoshis: o.satoshis,
        locking: lockPreview,
      })
    })
    process.exit(1)
  }

  console.log('outpoint :', funding.outpoint)
  console.log('satoshis :', funding.satoshis)
  console.log('locking  :', funding.lockingScript ?? '')
  console.log('2-of-2   :', is2of2(funding.lockingScript) ? 'yes' : 'no')
}

main().catch(err => {
  console.error('basket check failed:', err?.message ?? err)
  process.exit(1)
})
