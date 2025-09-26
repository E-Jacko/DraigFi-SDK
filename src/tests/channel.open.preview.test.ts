// run:  npx tsx src/tests/channel.open.preview.test.ts

import { connectWallet } from '@/adapters/wallet/WalletClient'
import { openChannelPreview } from '@/channel/api'

async function main() {
  // ensure wallet substrate is connected (Metanet Desktop must be running)
  await connectWallet()

  const theirIdentityKey =
    process.env.DRAIGFI_COUNTERPARTY_ID_KEY?.trim() ||
    '02cd23ba2e7dcd996ce4bcf1d40c5390db43525f377befe4a87db5e03524f79b6f'

  const preview = await openChannelPreview({ theirIdentityKey })

  console.log('network :', preview.network)
  console.log('✅ openChannelPreview:')
  console.log('  channelId      :', preview.channelId)
  console.log('  ourIdentityKey :', preview.ourIdentityKey)
  console.log('  theirIdentityKey:', preview.theirIdentityKey)
  console.log('  lockingScript  :', preview.lockingScriptAsm)
}

main().catch(err => {
  console.error('preview test failed:', err?.message ?? err)
  process.exit(1)
})
