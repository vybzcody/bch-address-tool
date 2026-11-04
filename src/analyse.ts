// === PHASE 1: types ===
import { decodeCashAddress, encodeCashAddress } from '@bitauth/libauth'

export type Network = 'mainnet' | 'testnet' | 'regtest' | 'legacy'

export interface AddressInfo {
  format: string
  network: Network
  tokenAware: boolean
  cashaddr: string
  tokenAwareAddr: string
}

// === PHASE 2: cashaddr charset helpers ===
const LEGACY_RE = /^[1-9A-HJ-NP-Za-km-z]{25,34}$/

// === PHASE 3: legacy detection ===
function isLegacy(addr: string): boolean {
  return LEGACY_RE.test(addr)
}

// === PHASE 4: main analyse function ===
export function analyse(raw: string): AddressInfo | null {
  if (!raw) return null

  if (isLegacy(raw)) {
    return {
      format: 'Legacy (Base58)',
      network: 'legacy',
      tokenAware: false,
      cashaddr: raw,
      tokenAwareAddr: '—',
    }
  }

  // try with and without prefix
  const candidates = raw.includes(':') ? [raw] : [`bitcoincash:${raw}`, `bchtest:${raw}`]

  for (const candidate of candidates) {
    const decoded = decodeCashAddress(candidate)
    if (typeof decoded === 'string') continue // error string = invalid

    const network: Network =
      decoded.prefix === 'bitcoincash' ? 'mainnet' :
      decoded.prefix === 'bchtest' ? 'testnet' : 'regtest'

    const tokenAware = decoded.type === 'p2pkhWithTokens' || decoded.type === 'p2shWithTokens'
    const baseType = tokenAware
      ? (decoded.type === 'p2pkhWithTokens' ? 'p2pkh' : 'p2sh')
      : decoded.type
    const tokenType = tokenAware
      ? decoded.type
      : (decoded.type === 'p2pkh' ? 'p2pkhWithTokens' : 'p2shWithTokens')

    const cashaddrResult = encodeCashAddress({ prefix: decoded.prefix, type: baseType as any, payload: decoded.payload })
    const tokenResult = encodeCashAddress({ prefix: decoded.prefix, type: tokenType as any, payload: decoded.payload })

    if (typeof cashaddrResult === 'string' || typeof tokenResult === 'string') continue

    const noPrefix = !raw.includes(':')
    const format = noPrefix ? 'CashAddr (no prefix)' : tokenAware ? 'CashAddr (token-aware)' : 'CashAddr'

    return {
      format,
      network,
      tokenAware,
      cashaddr: cashaddrResult.address,
      tokenAwareAddr: tokenResult.address,
    }
  }

  return null
}
