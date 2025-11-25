import CryptoJS from "crypto-js";

const SECRET_FOR_TOKEN =
  import.meta.env.VITE_SECRET_FOR_TOKEN ?? "123";

export function generateToken(): string {
  const currentTime = Math.floor(Date.now() / 86400000); // текущая дата в днях
  const raw = `${currentTime}${SECRET_FOR_TOKEN}`;
  return CryptoJS.SHA256(raw).toString(); // hex-строка
}

export const COMMON_TOKEN = generateToken();
