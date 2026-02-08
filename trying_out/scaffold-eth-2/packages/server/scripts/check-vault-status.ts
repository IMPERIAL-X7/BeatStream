/**
 * Check BeatStreamVault deployment status on Circle Arc Testnet.
 * Polls until COMPLETE and prints the on-chain contract address.
 *
 * Usage:
 *   npx tsx scripts/check-vault-status.ts [contractId]
 *
 * If contractId not passed, reads CIRCLE_VAULT_CONTRACT_ID from .env
 */
import "dotenv/config";
import {
  initiateSmartContractPlatformClient,
} from "@circle-fin/smart-contract-platform";

async function main() {
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  if (!apiKey || !entitySecret) {
    console.error("❌ CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET not set");
    process.exit(1);
  }

  const contractId = process.argv[2] || process.env.CIRCLE_VAULT_CONTRACT_ID;
  if (!contractId || contractId === "your_deployed_vault_contract_id") {
    console.error("❌ No contract ID. Pass as argument or set CIRCLE_VAULT_CONTRACT_ID in .env");
    process.exit(1);
  }

  const sdk = initiateSmartContractPlatformClient({ apiKey, entitySecret });

  console.log(`🔍 Checking contract ${contractId}...`);

  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await sdk.getContract({ id: contractId });
      const contract = res.data?.contract;

      console.log(`   Attempt ${i + 1}: status=${contract?.status ?? "UNKNOWN"}`);

      if (contract?.status === "COMPLETE") {
        console.log();
        console.log("✅ Deployment complete!");
        console.log(`   Contract Address: ${contract.contractAddress}`);
        console.log(`   Blockchain:       ${(contract as any).blockchain}`);
        console.log();
        console.log("📋 Add to .env:");
        console.log(`   CIRCLE_VAULT_CONTRACT_ADDRESS=${contract.contractAddress}`);
        return;
      }

      if (contract?.status === "FAILED") {
        console.error("❌ Deployment FAILED");
        console.error(JSON.stringify(contract, null, 2));
        process.exit(1);
      }
    } catch (err: any) {
      console.error(`   Error: ${err?.message ?? err}`);
    }

    // Wait 10 seconds between polls
    await new Promise((r) => setTimeout(r, 10000));
  }

  console.error("⏰ Timed out waiting for deployment (5 minutes)");
}

main();
