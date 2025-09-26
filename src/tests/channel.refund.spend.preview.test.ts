import { Transaction } from '@bsv/sdk'
import { connectWallet } from '@/adapters/wallet/WalletClient'
import { openChannelPreview, openChannelFund } from '@/channel/open'
import { refundSpendPreview } from '@/channel/refund'

async function main() {
  await connectWallet()

  const theirIdentityKey =
    process.env.DRAIGFI_COUNTERPARTY_ID_KEY?.trim() ||
    '02cd23ba2e7dcd996ce4bcf1d40c5390db43525f377befe4a87db5e03524f79b6f'

  const preview = await openChannelPreview({ theirIdentityKey })
  const funded = await openChannelFund({
    theirIdentityKey,
    depositSatoshis: Number(process.env.DRAIGFI_DEPOSIT_SATS ?? 1000),
    policy: { basePricePerUnit: 1, unit: 'second' }
  })

  if (!funded.tx) {
    console.log('ℹ️ need tx to preview refund spend; got reference:', funded.actionReference)
    return
  }

  const tx = Transaction.fromAtomicBEEF(funded.tx)
  const vout = 0
  const out0 = tx.outputs[vout]
  const satoshis = Number(out0.satoshis ?? 0)

  const args = {
    fundingTx: funded.tx,
    input: { vout, satoshis, lockingScriptHex: preview.lockingScriptHex },
    feeRate: Number(process.env.DRAIGFI_FEE_RATE ?? 1),
    lockTimeSeconds: Number(process.env.DRAIGFI_REFUND_LOCK_S ?? 600)
  } as any

  const spend: any = await refundSpendPreview(args)
  console.log('✅ refundSpendPreview:', spend)
}

main().catch(err => {
  console.error('refund spend preview failed:', err?.message ?? err)
  process.exit(1)
})
