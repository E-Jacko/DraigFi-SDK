export type NetworkName = 'mainnet' | 'testnet'

export interface OpenChannelParams {
  ourIdentityKey: string
  theirIdentityKey: string
  unit: 'second' | 'byte' | 'frame' | 'unit'
  basePricePerUnit: number
}

export interface OpenChannelPreview {
  channelId: string
  ourIdentityKey: string
  theirIdentityKey: string
  lockingScriptHex: string
  lockingScriptAsm: string
}
