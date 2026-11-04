# BCH Address Tool — Live Stream Tutorial

**Stack:** Vite + React + TypeScript  
**Deploy:** Netlify  
**Files you'll type:** `src/analyse.ts`, `src/App.css`, `src/App.tsx`

Keep this on your phone or second screen. Type exactly what's shown. The phase comments are already in the code — viewers will see them as you go.

---

## Before you go live

- [ ] Vite project bootstrapped, `npm install` done
- [ ] `npm run dev` running, browser open at localhost:5173
- [ ] Editor and browser side by side
- [ ] Have a few BCH addresses ready to test (listed at the bottom)

---

## Stream intro (say this)

> "Hey everyone — today we're building a BCH address tool from scratch with Vite and React. It'll take a BCH address, tell you the format, the network, whether it can receive CashTokens, and convert between formats. We'll deploy it to Netlify at the end. Let's go."

---

## PHASE 1 — Types (`src/analyse.ts`)

**Say:** "First I'll create a new file for the analysis logic and define the types."

Create `src/analyse.ts` and type:

```ts
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
```

**Say:** "BCH has a few address formats — legacy Base58 from the Bitcoin days, CashAddr which is the modern standard, and token-aware CashAddr which is needed to receive CashTokens. We want to detect all of them."

---

## PHASE 2 — CashAddr helpers (`src/analyse.ts` continued)

**Say:** "CashAddr uses its own character set. The first character of the payload encodes the address type — including whether it's token-aware. Let me add the helpers."

```ts
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
```

**Say:** "The `flipTokenBit` function is what lets us convert between a regular CashAddr and its token-aware version — same address, different prefix character."

---

## PHASE 3 — Legacy detection + analyse function (`src/analyse.ts` continued)

**Say:** "Now the main function. Legacy addresses are just Base58 — we detect them with a regex. Then we handle CashAddr with and without the prefix."

```ts
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
```

**Say:** "analyse.ts is done. No dependencies — pure TypeScript. Let's move to the styles."

---

## PHASE 4 — Styles (`src/App.css`)

**Say:** "I'll wipe the default Vite CSS and write our own dark theme."

Replace all of `src/App.css` with:

```css
/* === PHASE 1: reset & base === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, sans-serif;
  background: #070b10;
  color: #edf4f8;
  min-height: 100vh;
}

/* === PHASE 2: layout === */
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 16px 80px;
}

.header { text-align: center; margin-bottom: 32px; }
.header h1 { font-size: 32px; font-weight: 700; margin-bottom: 6px; }
.header p { color: #8293a2; font-size: 15px; }

.card {
  background: #111820;
  border: 1px solid #1e2d3a;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 580px;
}

/* === PHASE 3: input === */
.input-row { display: flex; gap: 8px; }

input[type="text"] {
  flex: 1;
  background: #0d1520;
  border: 1px solid #1e2d3a;
  border-radius: 8px;
  padding: 10px 14px;
  color: #edf4f8;
  font-size: 14px;
  font-family: monospace;
}
input[type="text"]:focus { outline: 2px solid #39e6a0; border-color: transparent; }

button.primary {
  background: #39e6a0;
  color: #070b10;
  font-weight: 700;
  font-size: 14px;
  padding: 10px 22px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
}
button.primary:hover { background: #2ecf8e; }

.error { color: #f87171; font-size: 13px; margin-top: 10px; }

/* === PHASE 4: results === */
.results { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #1e2d3a;
  gap: 12px;
  font-size: 13px;
}
.row:last-child { border-bottom: none; }
.row-label { color: #8293a2; flex-shrink: 0; }
.row-value { font-family: monospace; word-break: break-all; text-align: right; }

.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 20px;
}
.badge-green { background: rgba(57,230,160,0.15); color: #39e6a0; }
.badge-yellow { background: rgba(251,191,36,0.15); color: #fbbf24; }
.badge-red { background: rgba(248,113,113,0.15); color: #f87171; }

/* === PHASE 5: copy buttons === */
.copy-row { display: flex; gap: 8px; margin-top: 14px; }

button.copy {
  background: #1e2d3a;
  color: #edf4f8;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border: 1px solid #2a3a46;
  border-radius: 6px;
  cursor: pointer;
}
button.copy:hover { border-color: #39e6a0; color: #39e6a0; }
```

Also clear `src/index.css` — delete everything in it.

---

## PHASE 5 — App component (`src/App.tsx`)

**Say:** "Now the React component. I'll break it into a copy hook, a reusable Row component, and the main App."

Replace all of `src/App.tsx` with:

```tsx
// === PHASE 1: imports ===
import { useState } from 'react'
import './App.css'
import { analyse, type AddressInfo } from './analyse'

// === PHASE 2: copy helper hook ===
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    })
  }
  return { copied, copy }
}

// === PHASE 3: result row component ===
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="row">
      <span className="row-label">{label}</span>
      <span className="row-value">{children}</span>
    </div>
  )
}

// === PHASE 4: main app ===
export default function App() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<AddressInfo | null>(null)
  const [error, setError] = useState('')
  const { copied, copy } = useCopy()

  function run() {
    setError('')
    setResult(null)
    const raw = input.trim()
    if (!raw) { setError('Paste an address first'); return }
    const info = analyse(raw)
    if (!info) { setError('Unrecognised address format'); return }
    setResult(info)
  }

  // === PHASE 5: format labels ===
  const formatLabel: Record<string, string> = {
    legacy: 'Legacy (Base58)',
    cashaddr: 'CashAddr',
    'cashaddr-token': 'CashAddr (token-aware)',
    'cashaddr-no-prefix': 'CashAddr (no prefix)',
  }

  return (
    <div className="app">
      <div className="header">
        <h1>BCH Address Tool</h1>
        <p>Validate and convert any Bitcoin Cash address</p>
      </div>

      <div className="card">
        {/* === PHASE 3: input === */}
        <div className="input-row">
          <input
            type="text"
            placeholder="Paste a BCH address…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
          />
          <button className="primary" onClick={run}>Analyse</button>
        </div>

        {error && <p className="error">{error}</p>}

        {/* === PHASE 4: results === */}
        {result && (
          <div className="results">
            <Row label="Format">{formatLabel[result.format] ?? result.format}</Row>

            <Row label="Network">
              <span className={`badge ${result.network === 'mainnet' ? 'badge-green' : 'badge-yellow'}`}>
                {result.network}
              </span>
            </Row>

            <Row label="CashTokens">
              {result.tokenAware
                ? <span className="badge badge-green">Yes — can receive tokens</span>
                : <span className="badge badge-red">No — use token-aware address</span>}
            </Row>

            {result.format !== 'legacy' && (
              <>
                <Row label="CashAddr">{result.cashaddr}</Row>
                <Row label="Token-aware">{result.tokenAwareAddr}</Row>

                {/* === PHASE 5: copy buttons === */}
                <div className="copy-row">
                  <button className="copy" onClick={() => copy(result.cashaddr, 'cashaddr')}>
                    {copied === 'cashaddr' ? '✓ Copied' : 'Copy CashAddr'}
                  </button>
                  <button className="copy" onClick={() => copy(result.tokenAwareAddr, 'token')}>
                    {copied === 'token' ? '✓ Copied' : 'Copy Token-aware'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Say:** "That's the whole app. Let me test it."

---

## Test addresses (paste these live)

| Address | Expected result |
|---|---|
| `bitcoincash:qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy` | CashAddr, mainnet, no tokens |
| `bitcoincash:zp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy` | CashAddr token-aware, mainnet |
| `1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf` | Legacy, mainnet |
| `qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy` | CashAddr no prefix, mainnet |
| `notanaddress` | Error |

---

## Deploy to Netlify

**Say:** "Let's ship it."

```bash
npm run build
```

Then drag the `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop) live on stream.

**Say:** "Done — live URL, zero config, free hosting. That's the whole build."

---

## Stream outro (say this)

> "That's a BCH address validator built with Vite and React — detects legacy, CashAddr, token-aware addresses, converts between formats, deployed to Netlify in under an hour. If you're building on BCH, this is the kind of tooling the ecosystem needs. Source will be on GitHub. See you next time."
