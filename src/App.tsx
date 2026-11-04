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
