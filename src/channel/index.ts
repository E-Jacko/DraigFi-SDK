/* src/channel/index.ts
   DraigFi SDK — channel barrel
   Re-export the public surface so consumers can:
   import { openChannelPreview, openChannelFund, refundPreview } from '@/channel'
*/

export * from './types'
export * from './open'
export * from './refund'

// placeholders — implemented in Phase 2B/3
export * from './update'
export * from './close'