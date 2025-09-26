import { Transaction } from '@bsv/sdk'
import { connectWallet, getNetwork, getIdentityKey } from '@/adapters/wallet/WalletClient'
import { openChannelPreview, openChannelFund } from '@/channel' // <- note '@/channel'

async function main() {
  await connectWallet()

  const [me, net] = await Promise.all([getIdentityKey(), getNetwork()])
  console.log('network :', net)
  console.log('our id  :', me)

  const theirIdentityKey = process.env.DRAIGFI_COUNTERPARTY_ID_KEY
  if (!theirIdentityKey) throw new Error('DRAIGFI_COUNTERPARTY_ID_KEY is not set')

  const preview = await openChannelPreview({ theirIdentityKey })
  console.log('openChannelPreview:')
  console.log('  channelId     :', preview.channelId)
  console.log('  lockingScript :', preview.lockingScriptAsm)

  const res = await openChannelFund({
    theirIdentityKey,
    depositSatoshis: 1000,
    policy: { basePricePerUnit: 1, unit: 'second' }
  })

  if (!res.tx) {
    console.log('openChannel (fund): tx missing (wallet returned reference only)')
    console.log('  actionReference:', res.actionReference)
    return
  }

  const tx = Transaction.fromAtomicBEEF(res.tx)
  const out0 = tx.outputs[0]
  const fundScriptHex =
    (out0 as any)?.lockingScript?.toHex?.() ??
    (out0 as any)?.lockingScript ??
    ''

  const matches =
    fundScriptHex &&
    fundScriptHex.toLowerCase() === preview.lockingScriptHex.toLowerCase()

  console.log('openChannel (fund):')
  console.log('  tx present?     :', true)
  console.log('  script matches? :', !!matches)

  if (!matches) throw new Error('Funding output script does not match previewed 2-of-2 script')
}

main().catch((err) => {
  console.error('fund test failed:', err?.message ?? err)
  process.exit(1)
})
