// tiny script to prove phase-1 works end-to-end
// run with:  npm run test:wallet

import { setConfig } from "@/utils";
import { connectWallet, getIdentityKey, getNetwork } from "@/adapters/wallet/WalletClient";

async function main() {
  // set originator + basket to known values for the run
  setConfig({
    originator: "localhost",
    basketName: "draigfi"
  });

  // connect once (singleton)
  await connectWallet();

  // read a couple of properties to prove it works
  const id = await getIdentityKey();
  const net = await getNetwork();

  console.log("✅ wallet connected");
  console.log("   identity key :", id);
  console.log("   network      :", net);
}

main().catch((err) => {
  console.error("❌ phase-1 test failed:", err?.message ?? err);
  process.exit(1);
});
