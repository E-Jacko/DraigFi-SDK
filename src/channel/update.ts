/* src/channel/update.ts
   DraigFi SDK — off-chain updates (Phase 2B placeholders)
*/

export type UpdateCommitArgs = {
    channelId: string
    deltaSats: number           // positive to pay merchant, negative to refund buyer
    memo?: string               // optional annotation
  }
  
  /**
   * Placeholder for building/sending an *off-chain* update message.
   * In Phase 2B we’ll integrate Peer + chosen transport (MessageBox/Direct),
   * create/update commitment transactions, and exchange signatures.
   */
  export async function buildAndSendUpdate(_args: UpdateCommitArgs): Promise<void> {
    throw new Error('buildAndSendUpdate: not implemented (Phase 2B)')
  }
  