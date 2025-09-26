// tiny pure-helper to build a 2-of-2 multisig locking script from two identity keys
// we keep it minimal for preview; in 2B we’ll use a richer script builder if needed

export function serialize2of2Lock(pubKeyA: string, pubKeyB: string): { hex: string; asm: string } {
    const a = ensure33(pubKeyA)
    const b = ensure33(pubKeyB)
  
    // sort pubkeys for standardness (lexicographic)
    const [k1, k2] = [a, b].sort()
  
    const asm = [
      'OP_2',
      pushdata(k1),
      pushdata(k2),
      'OP_2',
      'OP_CHECKMULTISIG'
    ].join(' ')
  
    const hex = asmToHex(asm)
    return { hex, asm }
  }
  
  function ensure33(hex: string): string {
    const clean = hex.startsWith('02') || hex.startsWith('03') ? hex : hex.replace(/^0x/i, '')
    if (clean.length !== 66) throw new Error('expected 33-byte compressed pubkey hex')
    return clean
  }
  
  // very small helpers to convert ASM -> hex for pushes we use
  function pushdata(dataHex: string): string {
    const len = dataHex.length / 2
    if (len < 0x4c) return `${byte(len)} ${dataHex}`
    throw new Error('push too long for this minimal helper')
  }
  
  function byte(n: number): string {
    return Buffer.from([n]).toString('hex')
  }
  
  function asmToHex(asm: string): string {
    const parts = asm.split(/\s+/)
    const out: string[] = []
    for (const p of parts) {
      if (p === 'OP_2') out.push('52')
      else if (p === 'OP_CHECKMULTISIG') out.push('ae')
      else if (/^[0-9a-f]+$/i.test(p)) out.push(p)
      else throw new Error(`unknown asm token: ${p}`)
    }
    return out.join('')
  }
  