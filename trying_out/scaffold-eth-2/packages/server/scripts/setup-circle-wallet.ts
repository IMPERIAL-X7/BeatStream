/**
 * One-time setup: Create a Circle developer-controlled wallet
 * and print the wallet ID + address to add to .env
 */
import "dotenv/config";
import { initArc, createArcWallet, getWalletBalance } from "../src/services/arc.js";

async function main() {
  console.log("🔧 Circle Wallet Setup\n");

  // Initialize Circle SDK
  initArc();

  // Create wallet
  console.log("Creating developer-controlled wallet on Arc Testnet...\n");
  const wallet = await createArcWallet();

  if (!wallet) {
    console.error("❌ Failed to create wallet. Check your CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET.");
    process.exit(1);
  }

  console.log("\n═══════════════════════════════════════════════════");
  console.log("✅ Wallet created! Add these to your .env:\n");
  console.log(`CIRCLE_WALLET_ID=${wallet.walletId}`);
  console.log(`CIRCLE_WALLET_ADDRESS=${wallet.address}`);
  console.log("═══════════════════════════════════════════════════\n");

  // Check balance
  const balance = await getWalletBalance();
  if (balance) {
    console.log(`Balance — Native: ${balance.native}, USDC: ${balance.usdc}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
