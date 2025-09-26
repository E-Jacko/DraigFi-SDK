/* src/channel/index.ts
   DraigFi SDK — channel barrel
   Re-export the public surface so consumers can:
   import { openChannelPreview, openChannelFund, refundPreview } from '@/channel'
*/

// types
export * from './types'

// open / fund
export { openChannelPreview, openChannelFund, openChannel } from './open'

// refund (preview)
export { refundPreview } from './refund'

// placeholders for upcoming phases (export to stabilize API)
export { buildAndSendUpdate } from './update'
export { cooperativeClose, refundClose } from './close'
