// shared channel types

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
  
  export type OpenChannelFundArgs = OpenChannelParams & {
    depositSatoshis?: number
    policy: PricingPolicy
  }
  
  export type OpenChannelFundResult = {
    tx?: number[]
    actionReference?: string
  }
  
  export type RefundSpendPreviewArgs = {
    fundingTx: number[]   // atomic BEEF
    vout: number          // which output is the 2-of-2 UTXO
    refundAfterSeconds: number
  }
  
  export type RefundSpendPreview = {
    lockTime: number
    sequence: number
    funding: { vout: number; satoshis: number }
    refundTo: { address: string }
  }
  
  export type CooperativeClosePreview = {
    channelId: string
    redeemScriptAsm: string   // for preview purposes only
  }
  