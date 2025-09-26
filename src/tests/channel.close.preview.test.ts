// run:  npm run test:close:preview
import { connectWallet, getIdentityKey } from "@/adapters/wallet/WalletClient";
import {
  normalizePubKeyHex,
  isCompressedPubKeyHex,
  make2of2AsmDeterministic,
  make2of2HexFromAsm,
  parseTwoKeysFromAsm,
} from "@/channel/keyUtils";
import { cooperativeClosePreview } from "@/channel/close"; // your function from close.ts

async function main() {
  await connectWallet();

  const me = await getIdentityKey();
  const theirRaw = process.env.DRAIGFI_COUNTERPARTY_ID_KEY ?? "";
  const their = normalizePubKeyHex(theirRaw);

  console.log("theirIdentityKey(raw) :", theirRaw);
  console.log("theirIdentityKey(norm):", their);
  console.log("valid compressed?      :", isCompressedPubKeyHex(their));

  // Show deterministic script we expect both parties to agree on
  const detAsm = make2of2AsmDeterministic(me, their);
  const detHex = make2of2HexFromAsm(detAsm);
  console.log("deterministic ASM:", detAsm);
  console.log("deterministic HEX:", detHex);
  console.log("deterministic keys:", parseTwoKeysFromAsm(detAsm)?.join(" , "));

  // Now ask our close-preview (which should *also* normalize & validate)
  const preview = await cooperativeClosePreview({
    theirIdentityKey: their,
    // ... any other args your close preview accepts
  });

  console.log("✅ cooperative close preview:");
  console.log(preview);
}

main().catch(err => {
  console.error("cooperative close preview failed:", err?.message ?? err);
  process.exit(1);
});
