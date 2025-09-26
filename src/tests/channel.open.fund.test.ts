import { connectWallet, getNetwork, getIdentityKey } from '@/adapters/wallet/WalletClient'
import { openChannel } from '@/channel/api'

async function main() {
  // ensure wallet session
  await connectWallet()

  // show context
  const [me, net] = await Promise.all([getIdentityKey(), getNetwork()])
  console.log('network :', net)
  console.log('our id  :', me)

  // counterparty (second actor) – set in shell before running:
  // export DRAIGFI_COUNTERPARTY_ID_KEY=<their_everyday_identity_key>
  const theirIdentityKey = process.env.DRAIGFI_COUNTERPARTY_ID_KEY
  if (!theirIdentityKey) throw new Error('DRAIGFI_COUNTERPARTY_ID_KEY is not set')

  // 1) preview (keys only; no amount here)
  const preview = await openChannel.preview({
    theirIdentityKey
  })

  console.log('openChannelPreview:')
  console.log('  channelId      :', preview.channelId)
  console.log('  lockingScript  :', preview.lockingScriptAsm)

  // 2) fund with 1,000 sats (policy included here)
  const res = await openChannel.fund({
    theirIdentityKey,
    depositSatoshis: 1000,
    policy: { basePricePerUnit: 1, unit: 'second' }
  })

  console.log('openChannel (fund):')
  console.log('  tx present?     :', !!res.tx)
}

main().catch((err) => {
  console.error('fund test failed:', err?.message ?? err)
  process.exit(1)
})
