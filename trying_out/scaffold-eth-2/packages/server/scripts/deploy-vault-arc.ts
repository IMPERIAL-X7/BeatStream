/**
 * Deploy BeatStreamVault to Circle Arc Testnet via Circle's Smart Contract Platform.
 *
 * Usage:
 *   npx tsx scripts/deploy-vault-arc.ts
 *
 * Prerequisites:
 *   - .env has CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET
 *   - CIRCLE_WALLET_ID and CIRCLE_WALLET_ADDRESS set (run setup-circle-wallet.ts first)
 *
 * After deployment:
 *   - Script outputs the contractId → put it in .env as CIRCLE_VAULT_CONTRACT_ID
 *   - Run `npx tsx scripts/check-vault-status.ts` to poll until COMPLETE and get the address
 */
import "dotenv/config";
import {
  initiateSmartContractPlatformClient,
} from "@circle-fin/smart-contract-platform";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARC_TESTNET_CHAIN = "ARC-TESTNET";
const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

async function main() {
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
  const walletId = process.env.CIRCLE_WALLET_ID;
  const walletAddress = process.env.CIRCLE_WALLET_ADDRESS;

  if (!apiKey || !entitySecret || apiKey === "your_circle_api_key") {
    console.error("❌ CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET not set in .env");
    process.exit(1);
  }
  if (!walletId || !walletAddress) {
    console.error("❌ CIRCLE_WALLET_ID or CIRCLE_WALLET_ADDRESS not set in .env");
    console.error("   Run: npx tsx scripts/setup-circle-wallet.ts first");
    process.exit(1);
  }

  // Load compiled artifact
  const artifactPath = path.resolve(
    __dirname,
    "../../hardhat/artifacts/contracts/BeatStreamVault.sol/BeatStreamVault.json"
  );

  if (!fs.existsSync(artifactPath)) {
    console.error("❌ Artifact not found. Run `npx hardhat compile` in packages/hardhat first");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  // Circle wants pretty-printed ABI JSON string
  const abiJson = JSON.stringify(artifact.abi, null, 2);
  const bytecode = artifact.bytecode;

  console.log("🚀 Deploying BeatStreamVault to Arc Testnet...");
  console.log(`   Owner:  ${walletAddress}`);
  console.log(`   USDC:   ${ARC_USDC_ADDRESS}`);
  console.log(`   Wallet: ${walletId}`);
  console.log(`   ABI functions: ${artifact.abi.length}`);
  console.log(`   Bytecode: ${bytecode.length} chars`);
  console.log();

  const sdk = initiateSmartContractPlatformClient({ apiKey, entitySecret });

  try {
    const response = await sdk.deployContract({
      name: "BeatStreamVault",
      description: "USDC vault for pay-per-second music streaming. Deposits, beats, settlements.",
      blockchain: ARC_TESTNET_CHAIN,
      walletId,
      abiJson,
      bytecode,
      constructorParameters: [walletAddress, ARC_USDC_ADDRESS],
      fee: {
        type: "level",
        config: { feeLevel: "MEDIUM" },
      },
    });

    const contractId = response.data?.contractId;
    const txId = response.data?.transactionId;

    console.log("✅ Deployment submitted!");
    console.log(`   Contract ID:    ${contractId}`);
    console.log(`   Transaction ID: ${txId}`);
    console.log();
    console.log("📋 Next steps:");
    console.log(`   1. Add to .env: CIRCLE_VAULT_CONTRACT_ID=${contractId}`);
    console.log(`   2. Run: npx tsx scripts/check-vault-status.ts`);
    console.log(`      to poll until status=COMPLETE and get the on-chain address`);
  } catch (err: any) {
    console.error("❌ Deployment failed:");
    // Try every possible place Circle hides error details
    console.error("message:", err?.message);
    console.error("code:", err?.code);
    console.error("errors:", JSON.stringify(err?.errors, null, 2));
    if (err?.response) {
      console.error("response.status:", err.response.status);
      console.error("response.data:", JSON.stringify(err.response.data, null, 2));
    }
    // Dump all enumerable keys
    const keys = Object.keys(err || {});
    if (keys.length > 0) console.error("err keys:", keys);
    for (const k of keys) {
      if (!["message","stack","code","response","errors"].includes(k)) {
        try { console.error(`err.${k}:`, JSON.stringify(err[k], null, 2)); } catch {}
      }
    }
  }
}

main();
