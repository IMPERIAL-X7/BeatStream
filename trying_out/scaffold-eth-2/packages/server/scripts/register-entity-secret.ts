/**
 * Register Entity Secret with Circle
 *
 * Steps:
 * 1. Fetch Circle's RSA public key
 * 2. Encrypt our 32-byte entity secret with it
 * 3. Register the ciphertext with Circle's API
 */
import "dotenv/config";
import crypto from "crypto";

const API_KEY = process.env.CIRCLE_API_KEY!;
const ENTITY_SECRET_HEX = "3696d6ca33fb6e20ebc19fa4925a748dc29a7a7d61e49bc1af5f7940fedb3684";
const BASE_URL = "https://api.circle.com";

async function main() {
  console.log("🔑 Registering entity secret with Circle...\n");

  // Step 1: Fetch Circle's RSA public key
  console.log("1️⃣  Fetching Circle's public key...");
  const pkRes = await fetch(`${BASE_URL}/v1/w3s/config/entity/publicKey`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!pkRes.ok) {
    const err = await pkRes.text();
    console.error("❌ Failed to fetch public key:", pkRes.status, err);
    process.exit(1);
  }

  const pkData = (await pkRes.json()) as { data: { publicKey: string } };
  const publicKeyPem = pkData.data.publicKey;
  console.log("   ✅ Got public key\n");

  // Step 2: Encrypt entity secret with RSA-OAEP + SHA-256
  console.log("2️⃣  Encrypting entity secret...");
  const entitySecretBuffer = Buffer.from(ENTITY_SECRET_HEX, "hex");

  const encryptedBuffer = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    entitySecretBuffer
  );

  const ciphertext = encryptedBuffer.toString("base64");
  console.log("   ✅ Ciphertext generated (length:", ciphertext.length, ")\n");

  // Step 3: Register with Circle
  console.log("3️⃣  Registering entity secret ciphertext with Circle...");
  const regRes = await fetch(
    `${BASE_URL}/v1/w3s/config/entity/entitySecret`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entitySecretCiphertext: ciphertext,
      }),
    }
  );

  if (!regRes.ok) {
    const err = await regRes.text();
    console.error("❌ Registration failed:", regRes.status, err);
    process.exit(1);
  }

  console.log("   ✅ Entity secret registered successfully!\n");

  // Output
  console.log("═══════════════════════════════════════════════════");
  console.log("Your CIRCLE_ENTITY_SECRET (put in .env):");
  console.log(ENTITY_SECRET_HEX);
  console.log("═══════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
