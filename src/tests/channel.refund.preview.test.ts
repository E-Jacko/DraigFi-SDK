// run:  npx tsx src/tests/channel.refund.preview.test.ts

import { connectWallet } from '@/adapters/wallet/WalletClient'
import { openChannelFund, openChannelPreview, refundPreview } from '@/channel/api'

async function main() {
  await connectWallet()

  const theirIdentityKey =
    process.env.DRAIGFI_COUNTERPARTY_ID_KEY?.trim() ||
    '02cd23ba2e7dcd996ce4bcf1d40c5390db43525f377befe4a87db5e03524f79b6f'

  // preview (optional, just context)
  await openChannelPreview({ theirIdentityKey })

  const fund = await openChannelFund({
    theirIdentityKey,
    policy: { basePricePerUnit: 1, unit: 'second' }
  })

  if (!fund.tx) {
    console.log('ℹ️  wallet returned an action reference only; need a tx to preview refund.')
    console.log('   reference:', fund.actionReference)
    return
  }

  const r = await refundPreview({
    fundingTx: fund.tx,
    vout: 0,
    refundAfterSeconds: 600
  })

  console.log('✅ refundPreview:')
  console.log('  lockTime     :', r.lockTime)
  console.log('  sequence     :', r.sequence)
  console.log('  funding vout :', r.funding.vout)
  console.log('  funding sats :', r.funding.satoshis)
  console.log('  refund addr  :', r.refundTo.address)
}

main().catch(err => {
  console.error('refund preview failed:', err?.message ?? err)
  process.exit(1)
})
