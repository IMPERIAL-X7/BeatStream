/**
 * Deploy BeatStreamVault to Arc Testnet using direct Circle API calls.
 * Bypasses the SDK to properly handle entitySecretCiphertext, idempotencyKey, etc.
 */
import "dotenv/config";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://api.circle.com";
const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

async function generateEntitySecretCiphertext(): Promise<string> {
  const entitySecretHex = process.env.CIRCLE_ENTITY_SECRET!;
  const apiKey = process.env.CIRCLE_API_KEY!;

  // 1. Fetch Circle's RSA public key
  console.log("🔑 Fetching Circle RSA public key...");
  const pkRes = await fetch(`${BASE_URL}/v1/w3s/config/entity/publicKey`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!pkRes.ok) {
    const err = await pkRes.text();
    throw new Error(`Failed to fetch public key: ${pkRes.status} ${err}`);
  }

  const pkData = (await pkRes.json()) as { data: { publicKey: string } };
  const publicKeyPem = pkData.data.publicKey;
  console.log("   ✅ Got public key");

  // 2. Encrypt entity secret with RSA-OAEP + SHA-256
  const entitySecretBuffer = Buffer.from(entitySecretHex, "hex");
  const encryptedBuffer = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    entitySecretBuffer
  );

  return encryptedBuffer.toString("base64");
}

async function main() {
  const apiKey = process.env.CIRCLE_API_KEY!;
  const walletId = process.env.CIRCLE_WALLET_ID!;
  const walletAddress = process.env.CIRCLE_WALLET_ADDRESS!;

  // Load compiled artifact
  const artifactPath = path.resolve(
    __dirname,
    "../../hardhat/artifacts/contracts/BeatStreamVault.sol/BeatStreamVault.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  // Generate entity secret ciphertext (fresh each time)
  const entitySecretCiphertext = await generateEntitySecretCiphertext();
  console.log("   ✅ Entity secret encrypted (length:", entitySecretCiphertext.length, ")");

  // Generate unique idempotency key
  const idempotencyKey = uuidv4();
  console.log("   🆔 Idempotency key:", idempotencyKey);

  const body = {
    idempotencyKey,
    name: "BeatStreamVault",
    description: "BeatStreamVault USDC vault for streaming payments",
    blockchain: "ARC-TESTNET",
    walletId,
    entitySecretCiphertext,
    abiJson: JSON.stringify(artifact.abi, null, 2),
    bytecode: artifact.bytecode,
    constructorParameters: [walletAddress, ARC_USDC_ADDRESS],
    feeLevel: "MEDIUM",
  };

  console.log("\n🚀 Deploying BeatStreamVault to Arc Testnet...");
  console.log(`   Owner:  ${walletAddress}`);
  console.log(`   USDC:   ${ARC_USDC_ADDRESS}`);
  console.log(`   Wallet: ${walletId}`);
  console.log(`   ABI entries: ${artifact.abi.length}`);
  console.log(`   Bytecode: ${artifact.bytecode.length} chars\n`);

  const res = await fetch(`${BASE_URL}/v1/w3s/contracts/deploy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  console.log("=== Response Status:", res.status);
  const responseText = await res.text();

  try {
    const data = JSON.parse(responseText);
    if (res.ok) {
      console.log("\n✅ Deployment submitted!");
      console.log(`   Contract ID:    ${data.data?.contractId}`);
      console.log(`   Transaction ID: ${data.data?.transactionId}`);
      console.log(`   Deployment ID:  ${data.data?.deploymentId || data.data?.id}`);
      console.log("\n📋 Next steps:");
      console.log(`   1. Add to .env: CIRCLE_VAULT_CONTRACT_ID=${data.data?.contractId || data.data?.id}`);
      console.log(`   2. Run: npx tsx scripts/check-vault-status.ts`);
    } else {
      console.error("\n❌ Deployment failed:");
      console.error(JSON.stringify(data, null, 2));
    }
  } catch {
    console.error("Raw response:", responseText);
  }
}

main().catch(console.error);
