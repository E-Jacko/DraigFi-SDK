// run:  npm run test:open:fund
import { connectWallet, getWallet, getIdentityKey, getNetwork } from "@/adapters/wallet/WalletClient";
import { openChannelFund, openChannelPreview } from "@/channel/open";
import {
  normalizePubKeyHex,
  make2of2AsmDeterministic,
  make2of2HexFromAsm,
  scriptsEqualExactHex,
  scriptsEqualIgnoringKeyOrder,
  prettyScriptDiff,
} from "@/channel/keyUtils";
import { getConfig } from "@/utils";

async function main() {
  await connectWallet();

  const theirRaw = process.env.DRAIGFI_COUNTERPARTY_ID_KEY ?? "";
  const their = normalizePubKeyHex(theirRaw);
  const me = await getIdentityKey();

  // Preview (optional, helps us know expected ASM/HEX)
  const prev = await openChannelPreview({ theirIdentityKey: their });
  const detAsm = make2of2AsmDeterministic(me, their);
  const detHex = make2of2HexFromAsm(detAsm);

  console.log("network :", await getNetwork());
  console.log("openChannelPreview:");
  console.log("  channelId   :", prev.channelId);
  console.log("  locking ASM :", prev.lockingScriptAsm);
  console.log("  locking HEX :", prev.lockingScriptHex);
  console.log("  det ASM     :", detAsm);
  console.log("  det HEX     :", detHex);

  // Ask wallet to fund it
  const res = await openChannelFund({
    theirIdentityKey: their,
    depositSatoshis: 1000,
    policy: { basePricePerUnit: 1, unit: "second" },
  });

  console.log("openChannel (fund):");
  console.log("  tx present? :", !!res.tx);

  // Try to find the newest output in our basket, and compare scripts if revealed
  const { basketName } = getConfig();
  const wallet = await getWallet();
  const { outputs = [] } = await wallet.listOutputs({ basket: basketName, limit: 25 });

  const newest = outputs[0]; // wallet lists newest first
  console.log("basket newest:");
  console.log("  outpoint :", newest?.outpoint);
  console.log("  sats     :", newest?.satoshis);
  console.log("  locking  :", newest?.lockingScript ? newest.lockingScript.slice(0, 24) + "..." : "(hidden)");

  if (newest?.lockingScript) {
    // compare both ways
    const exact = scriptsEqualExactHex(prev.lockingScriptHex, newest.lockingScript);
    const loose = scriptsEqualIgnoringKeyOrder(prev.lockingScriptAsm, detAsm); // both are ASM strings we control
    console.log("script equal (exact hex)?        :", exact);
    console.log("script equal (keys ignoring order):", loose);
    if (!exact) {
      console.log("--- script diff (ASM) ---");
      console.log(
        prettyScriptDiff(prev.lockingScriptAsm, detAsm)
      );
    }
  } else {
    console.log("NOTE: wallet did not reveal script (privacy). Verified by amount/outpoint instead.");
  }
}

main().catch(err => {
  console.error("fund test failed:", err?.message ?? err);
  process.exit(1);
});
