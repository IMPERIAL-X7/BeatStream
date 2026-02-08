// Quick test: Try to register a subdomain on-chain via NameWrapper
// Run: cd packages/server && npx tsx scripts/test-subdomain-register.ts
import "dotenv/config";
import { initENS, registerArtistSubdomain, isSubdomainRegistered } from "../src/services/ens.js";

async function main() {
  console.log("🧪 Testing subdomain registration on-chain...\n");

  // Init ENS service
  initENS();

  // Check if beatstream.eth is wrapped
  console.log("1. Checking if beatstream.eth is in NameWrapper...");
  const parentWrapped = await isSubdomainRegistered("beatstream.eth");
  console.log(`   beatstream.eth wrapped: ${parentWrapped}\n`);

  if (!parentWrapped) {
    console.log("❌ beatstream.eth is NOT in NameWrapper. Cannot create subdomains.");
    process.exit(1);
  }

  // Try to register synthwave.beatstream.eth
  console.log("2. Attempting to register synthwave.beatstream.eth...");
  console.log("   Calling NameWrapper.setSubnodeRecord()...\n");

  try {
    const result = await registerArtistSubdomain(
      "SynthWave",
      "0x1111111111111111111111111111111111111111" as `0x${string}`
    );

    console.log("   Result:", JSON.stringify(result, null, 2));

    if (result.simulated) {
      console.log("\n⚠️  SIMULATED — The on-chain call reverted and fell back to simulation.");
      console.log("   This means NameWrapper.setSubnodeRecord() still fails.");
      console.log("   Possible causes:");
      console.log("   - Server wallet is not the NameWrapper owner of beatstream.eth");
      console.log("   - Fuses/permissions issue");
      console.log("   - Wrong parentNode hash");
    } else {
      console.log("\n✅ SUCCESS — Subdomain created ON-CHAIN!");
      console.log(`   TX Hash: ${result.txHash}`);
    }
  } catch (err) {
    console.error("\n❌ Error:", err);
  }

  // Verify
  console.log("\n3. Verifying synthwave.beatstream.eth in NameWrapper...");
  const subRegistered = await isSubdomainRegistered("synthwave.beatstream.eth");
  console.log(`   synthwave.beatstream.eth registered: ${subRegistered}`);

  process.exit(0);
}

main().catch(console.error);
