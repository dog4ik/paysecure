import crypto from "node:crypto";
import type { PaysecureWebhook } from "./callback.js";

export function verifySignature(
  { message }: PaysecureWebhook,
  publicKeyAsset: string,
  signature: string,
) {
  let assetBuffer = Buffer.from(publicKeyAsset, "base64").toString();
  let signString = [message.purchaseId, message.status, message.brand_id].join(
    "|",
  );
  console.log("Signature string: ", signString);
  console.log("Asset buffer: ", assetBuffer);
  let verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(signString);
  verifier.end();

  let valid = verifier.verify(
    assetBuffer,
    Buffer.from(signature, "base64"),
  );

  if (!valid) {
    throw Error("Callback signature is invalid");
  }
}
