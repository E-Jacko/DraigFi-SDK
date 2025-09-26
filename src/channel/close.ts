/* src/channel/close.ts
   DraigFi SDK — closing a channel (Phase 2C placeholders)
*/

export type CooperativeCloseArgs = {
    channelId: string
    finalAllocation?: { toBuyerSats: number; toMerchantSats: number }
  }
  
  /**
   * Placeholder for cooperative close (both parties sign the final state).
   * In Phase 2C we will construct/broadcast the settlement transaction.
   */
  export async function cooperativeClose(_args: CooperativeCloseArgs): Promise<void> {
    throw new Error('cooperativeClose: not implemented (Phase 2C)')
  }
  
  /**
   * Placeholder for unilateral/timeout close (e.g., use refund branch).
   * In Phase 2C we’ll finalize and broadcast the refund if needed.
   */
  export async function refundClose(_channelId: string): Promise<void> {
    throw new Error('refundClose: not implemented (Phase 2C)')
  }
  