// run:  npm run test:open:preview
import { connectWallet, getIdentityKey, getNetwork } from "@/adapters/wallet/WalletClient";
import { openChannelPreview } from "@/channel/open";
import { normalizePubKeyHex, make2of2AsmDeterministic, make2of2HexFromAsm, parseTwoKeysFromAsm } from "@/channel/keyUtils";

async function main() {
  await connectWallet();

  const [me, net] = await Promise.all([getIdentityKey(), getNetwork()]);
  const theirRaw = process.env.DRAIGFI_COUNTERPARTY_ID_KEY ?? "";
  const their = normalizePubKeyHex(theirRaw);

  const preview = await openChannelPreview({ theirIdentityKey: their });

  console.log("network :", typeof net === "string" ? net : net.network);
  console.log("✅ openChannelPreview:");
  console.log("  channelId      :", preview.channelId);
  console.log("  ourIdentityKey :", me);
  console.log("  theirIdentityKey(raw) :", theirRaw);
  console.log("  theirIdentityKey(norm):", their);

  // our deterministic ASM/HEX (for comparison in other tests)
  const detAsm = make2of2AsmDeterministic(me, their);
  const detHex = make2of2HexFromAsm(detAsm);
  console.log("  deterministic ASM :", detAsm);
  console.log("  deterministic HEX :", detHex);
  console.log("  preview ASM        :", preview.lockingScriptAsm);
  console.log("  preview HEX        :", preview.lockingScriptHex);

  const detKeys = parseTwoKeysFromAsm(detAsm);
  console.log("  keys(det order)    :", detKeys?.join(" , "));
}

main().catch(err => {
  console.error("preview test failed:", err?.message ?? err);
  process.exit(1);
});
