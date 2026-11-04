// === PHASE 1: types ===
export type AddressFormat = 'legacy' | 'cashaddr' | 'cashaddr-token' | 'cashaddr-no-prefix' | 'unknown'
export type Network = 'mainnet' | 'testnet' | 'regtest'

export interface AddressInfo {
  format: AddressFormat
  network: Network
  tokenAware: boolean
  cashaddr: string
  tokenAwareAddr: string
}

// === PHASE 2: cashaddr charset helpers ===
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

function isValidCashaddrPayload(payload: string): boolean {
  return [...payload].every(c => CHARSET.includes(c))
}

function isTokenAwarePayload(payload: string): boolean {
  // first char encodes version: bits [4:3] = type, 0=P2PKH,1=P2SH,2=P2PKH-token,3=P2SH-token
  const v = CHARSET.indexOf(payload[0])
  return v >= 0 && ((v >> 3) & 0x3) >= 2
}

function flipTokenBit(payload: string): string {
  const v = CHARSET.indexOf(payload[0])
  if (v < 0) return payload
  const typeField = (v >> 3) & 0x3
  const newType = typeField >= 2 ? typeField - 2 : typeField + 2
  const newV = (newType << 3) | (v & 0x7)
  return CHARSET[newV] + payload.slice(1)
}

// === PHASE 3: legacy detection ===
function isLegacy(addr: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(addr)
}

// === PHASE 4: main analyse function ===
export function analyse(raw: string): AddressInfo | null {
  if (!raw) return null
  const lower = raw.toLowerCase()

  // legacy
  if (isLegacy(raw)) {
    return {
      format: 'legacy',
      network: (raw[0] === '1' || raw[0] === '3') ? 'mainnet' : 'testnet',
      tokenAware: false,
      cashaddr: raw,
      tokenAwareAddr: '—',
    }
  }

  // cashaddr with prefix
  let prefix: string | null = null
  let payload: string | null = null
  if (lower.startsWith('bitcoincash:')) { prefix = 'bitcoincash'; payload = lower.slice(12) }
  else if (lower.startsWith('bchtest:')) { prefix = 'bchtest'; payload = lower.slice(8) }
  else if (lower.startsWith('bchreg:')) { prefix = 'bchreg'; payload = lower.slice(7) }

  if (prefix && payload) {
    if (!isValidCashaddrPayload(payload)) return null
    const tokenAware = isTokenAwarePayload(payload)
    const network: Network = prefix === 'bitcoincash' ? 'mainnet' : prefix === 'bchtest' ? 'testnet' : 'regtest'
    const flipped = flipTokenBit(payload)
    return {
      format: tokenAware ? 'cashaddr-token' : 'cashaddr',
      network,
      tokenAware,
      cashaddr: tokenAware ? `${prefix}:${flipped}` : raw,
      tokenAwareAddr: tokenAware ? raw : `${prefix}:${flipped}`,
    }
  }

  // cashaddr without prefix — assume mainnet
  if (isValidCashaddrPayload(lower)) {
    const tokenAware = isTokenAwarePayload(lower)
    const flipped = flipTokenBit(lower)
    return {
      format: 'cashaddr-no-prefix',
      network: 'mainnet',
      tokenAware,
      cashaddr: tokenAware ? `bitcoincash:${flipped}` : `bitcoincash:${lower}`,
      tokenAwareAddr: tokenAware ? `bitcoincash:${lower}` : `bitcoincash:${flipped}`,
    }
  }

  return null
}
