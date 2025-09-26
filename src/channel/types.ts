/* src/channel/types.ts
   DraigFi SDK — channel type definitions
*/

export type PricingPolicy = {
    /** price for a single unit (e.g., per second, per MB, per frame) */
    basePricePerUnit: number
    /** the priced unit label; purely informational for now */
    unit: string
  }
  
  export type OpenChannelParams = {
    /** the counterparty’s public identity key (hex) */
    theirIdentityKey: string
  }
  
  export type OpenChannelPreview = {
    /** wallet network we’re on */
    network: 'mainnet' | 'testnet'
    /** short, deterministic id for display/logging only */
    channelId: string
    /** our identity key (hex) */
    ourIdentityKey: string
    /** peer identity key (hex) */
    theirIdentityKey: string
    /** 2-of-2 locking script in hex and ASM forms */
    lockingScriptHex: string
    lockingScriptAsm: string
  }
  
  export type OpenChannelFundResult = {
    /** fully-built tx in Atomic BEEF (if wallet auto-signed/built) */
    tx?: number[]
    /** action reference to resume/sign/broadcast inside the wallet UI */
    actionReference?: string
  }
  
  export type RefundPreviewArgs = {
    /** funding tx (Atomic BEEF) */
    fundingTx: number[]
    /** vout of the funding output (default: 0) */
    vout: number
    /** seconds from “now” before refund is valid */
    refundAfterSeconds: number
  }
  
  export type RefundPreview = {
    /** absolute locktime for the refund tx (seconds since epoch) */
    lockTime: number
    /** sequence used with locktime (non-final) */
    sequence: number
    /** funding output details we’re refunding from */
    funding: {
      vout: number
      satoshis: number
    }
    /** destination for the refund */
    refundTo: {
      address: string
    }
  }
  