import CryptoJS from "crypto-js";

// Hardcoded static key for simple implementation. 
// In a full production app with E2EE, this would be dynamically derived per conversation.
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || "low-latency-chat-secret-key-1234!!";

export const encryptMessage = (text) => {
  if (!text) return text;
  try {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  } catch (err) {
    console.error("Encryption failed:", err);
    return text;
  }
};

export const decryptMessage = (ciphertext) => {
  if (!ciphertext) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    // Fallback if decryption returns an empty string (meaning it was not encrypted with this key, or was plain text)
    if (!originalText) {
      return ciphertext; 
    }
    return originalText;
  } catch (err) {
    // If decryption throws an error (e.g. malformed ciphertext, meaning it's likely plain text)
    return ciphertext;
  }
};
