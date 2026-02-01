import crypto from "node:crypto";

type SecureBlock = {
  encrypted_data: string;
  iv_value: string;
};

type JwtPayload = {
  [key: string]: any;
  secure: SecureBlock;
};

function base64UrlEncode(buffer: Buffer | string): string {
  return Buffer.from(buffer).toString("base64url");
}

function generateIV(): Buffer {
  return crypto.randomBytes(16);
}

function encryptMerchantKey(
  merchantKey: string,
  signKey: Buffer, // 32 bytes
  iv: Buffer,
): { encryptedData: string; ivBase64: string } {
  const cipher = crypto.createCipheriv("aes-256-cbc", signKey, iv);

  let encrypted = cipher.update(merchantKey, "utf8", "base64");
  encrypted += cipher.final("base64");

  return {
    encryptedData: encrypted,
    ivBase64: iv.toString("base64"),
  };
}

// Simple HS512 JWT encoder (no external jwt library)
function encodeHS512(payload: object, secret: Buffer): string {
  const header = {
    alg: "HS512",
    typ: "JWT",
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const input = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac("sha512", secret);
  hmac.update(input);
  const signature = base64UrlEncode(hmac.digest());

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function createJwt(
  payload: Record<string, any>,
  merchantKey: string,
  signKey: Buffer,
): string {
  const iv = generateIV();

  const { encryptedData, ivBase64 } = encryptMerchantKey(
    merchantKey,
    signKey,
    iv,
  );

  const jwtPayload: JwtPayload = {
    ...payload,
    secure: {
      encrypted_data: encryptedData,
      iv_value: ivBase64,
    },
  };

  const token = encodeHS512(jwtPayload, signKey);

  return token;
}
