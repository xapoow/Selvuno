const PRIVACY_CREDENTIAL_KEY = "myfinances:privacy-credential:v1";
const PRIVACY_CONFIG_KEY = "myfinances:privacy-config:v1";
const PIN_ITERATIONS = 210_000;
export const PIN_LENGTH = 6;

export const autoLockOptions = [0, 1, 5, 15, 30] as const;
export type AutoLockMinutes = (typeof autoLockOptions)[number];

interface StoredPinCredential {
  version: 1;
  salt: string;
  hash: string;
  iterations: number;
}

export interface PrivacyConfig {
  autoLockMinutes: AutoLockMinutes;
}

const defaultPrivacyConfig: PrivacyConfig = {
  autoLockMinutes: 0
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derivePinHash(pin: string, salt: Uint8Array, iterations: number): Promise<string> {
  const saltBuffer = Uint8Array.from(salt).buffer;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBuffer,
      iterations
    },
    key,
    256
  );
  return bytesToBase64(new Uint8Array(bits));
}

function readCredential(): StoredPinCredential | null {
  try {
    const raw = localStorage.getItem(PRIVACY_CREDENTIAL_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<StoredPinCredential>;
    if (
      parsed.version !== 1 ||
      typeof parsed.salt !== "string" ||
      typeof parsed.hash !== "string" ||
      typeof parsed.iterations !== "number"
    ) {
      return null;
    }
    return parsed as StoredPinCredential;
  } catch {
    return null;
  }
}

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

export function hasPinCredential(): boolean {
  return Boolean(readCredential());
}

export async function savePinCredential(pin: string): Promise<void> {
  if (!isValidPin(pin)) {
    throw new Error(`PIN must contain exactly ${PIN_LENGTH} digits.`);
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const credential: StoredPinCredential = {
    version: 1,
    salt: bytesToBase64(salt),
    hash: await derivePinHash(pin, salt, PIN_ITERATIONS),
    iterations: PIN_ITERATIONS
  };
  localStorage.setItem(PRIVACY_CREDENTIAL_KEY, JSON.stringify(credential));
}

export async function verifyPinCredential(pin: string): Promise<boolean> {
  const credential = readCredential();
  if (!credential || !isValidPin(pin)) {
    return false;
  }
  const candidate = await derivePinHash(
    pin,
    base64ToBytes(credential.salt),
    credential.iterations
  );
  if (candidate.length !== credential.hash.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < candidate.length; index += 1) {
    difference |= candidate.charCodeAt(index) ^ credential.hash.charCodeAt(index);
  }
  return difference === 0;
}

export function removePinCredential(): void {
  localStorage.removeItem(PRIVACY_CREDENTIAL_KEY);
  writePrivacyConfig(defaultPrivacyConfig);
}

export function readPrivacyConfig(): PrivacyConfig {
  try {
    const raw = localStorage.getItem(PRIVACY_CONFIG_KEY);
    if (!raw) {
      return defaultPrivacyConfig;
    }
    const parsed = JSON.parse(raw) as Partial<PrivacyConfig>;
    return {
      autoLockMinutes: autoLockOptions.includes(parsed.autoLockMinutes as AutoLockMinutes)
        ? (parsed.autoLockMinutes as AutoLockMinutes)
        : 0
    };
  } catch {
    return defaultPrivacyConfig;
  }
}

export function writePrivacyConfig(config: PrivacyConfig): void {
  localStorage.setItem(PRIVACY_CONFIG_KEY, JSON.stringify(config));
}

export function clearPrivacyData(): void {
  localStorage.removeItem(PRIVACY_CREDENTIAL_KEY);
  localStorage.removeItem(PRIVACY_CONFIG_KEY);
}
