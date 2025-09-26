/* src/channel/index.ts
   Single, explicit export surface for channel features.
   Why explicit (vs `export *`)? It prevents accidental API drift when files
   add helpers that aren’t meant to be public. Add new exports here on purpose.
*/

export { openChannelPreview, openChannelFund } from './open'
export { cooperativeClosePreview } from './close'
export { refundPreview, refundSpendPreview } from './refund'
