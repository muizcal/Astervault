import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, ArrowDownLeft, RefreshCw, Layers, Shield, ChevronDown, ExternalLink, Zap } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { CONTRACTS } from '../abi/contracts'

const STRATEGY_LABELS = ['AsterEarn BNB', 'AsterEarn USDF', 'PancakeSwap Stack']

const mockYieldData = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  value: 1 + (i * 0.003) + (Math.sin(i) * 0.001),
}))

function StatCard({ label, value, sub, color = 'text-gold', glow }) {
  return (
    <div className={`card rounded-xl p-5 ${glow ? 'gold-border' : ''}`}>
      <div className="font-mono text-xs text-text-dim mb-2">{label}</div>
      <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-text-dim mt-1">{sub}</div>}
    </div>
  )
}

function FormatBNB({ value }) {
  const n = parseFloat(value)
  if (isNaN(n)) return <span>—</span>
  return <span>{n.toFixed(6)} BNB</span>
}

function FormatTimer({ seconds }) {
  if (seconds === 0) return <span className="text-teal">Ready</span>
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return <span>{h}h {m}m</span>
}

export default function VaultDashboard({ wallet, vault }) {
  const { vaultData, deposit, withdraw, compound } = vault
  const [tab, setTab] = useState('deposit')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawShares, setWithdrawShares] = useState('')
  const [txLoading, setTxLoading] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [txError, setTxError] = useState(null)

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return
    setTxLoading(true); setTxError(null); setTxHash(null)
    try {
      const hash = await deposit(depositAmount)
      setTxHash(hash)
      setDepositAmount('')
      await wallet.refreshBalance()
    } catch (e) {
      setTxError(e.message?.slice(0, 120) || 'Transaction failed')
    } finally {
      setTxLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawShares || parseFloat(withdrawShares) <= 0) return
    setTxLoading(true); setTxError(null); setTxHash(null)
    try {
      const hash = await withdraw(withdrawShares)
      setTxHash(hash)
      setWithdrawShares('')
    } catch (e) {
      setTxError(e.message?.slice(0, 120) || 'Transaction failed')
    } finally {
      setTxLoading(false)
    }
  }

  const handleCompound = async () => {
    setTxLoading(true); setTxError(null); setTxHash(null)
    try {
      const hash = await compound()
      setTxHash(hash)
    } catch (e) {
      setTxError(e.message?.slice(0, 120) || 'Compound failed')
    } finally {
      setTxLoading(false)
    }
  }

  return (
    <div className="py-12 space-y-6">
      {/* Top Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-4 gap-4"
      >
        <StatCard
          label="YOUR VAULT VALUE"
          value={<FormatBNB value={vaultData.userValueBNB} />}
          sub="Principal + Yield"
          glow
        />
        <StatCard
          label="YOUR YIELD EARNED"
          value={<FormatBNB value={vaultData.userYieldBNB} />}
          sub="Real-time from blockchain"
          color="text-teal"
        />
        <StatCard
          label="VAULT HOLDS asBNB"
          value={`${parseFloat(vaultData.asBNBBalanceFormatted).toFixed(6)}`}
          sub={vaultData.isStaked ? "🟢 Earning via AsterEarn" : "No deposits yet"}
          color="text-gold"
        />
        <StatCard
          label="TOTAL VAULT TVL"
          value={<FormatBNB value={vaultData.totalValueBNB} />}
          sub="All depositors"
          color="text-text"
        />
      </motion.div>

      {/* Second row: strategy + compound + staking info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="card rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}>
            <Layers size={20} className="text-teal" />
          </div>
          <div className="flex-1">
            <div className="font-mono text-xs text-text-dim mb-0.5">FUNDS DEPLOYED IN</div>
            <div className="font-display font-semibold text-teal text-sm">AsterEarn → Lista DAO</div>
            <div className="font-mono text-xs text-text-dim mt-0.5">
              {vaultData.isStaked ? "✅ Staking active" : "⏳ No stakes yet"}
            </div>
          </div>
        </div>

        <div className="card rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}>
            <RefreshCw size={20} className="text-teal" />
          </div>
          <div className="flex-1">
            <div className="font-mono text-xs text-text-dim mb-0.5">NEXT COMPOUND</div>
            <div className="font-display font-semibold text-teal">
              <FormatTimer seconds={vaultData.nextCompoundIn} />
            </div>
          </div>
          <button
            onClick={handleCompound}
            disabled={txLoading || vaultData.nextCompoundIn > 0}
            className="btn-ghost px-3 py-2 rounded-lg text-xs cursor-pointer disabled:opacity-40"
          >
            Run Now
          </button>
        </div>

        <div className="card rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Shield size={20} className="text-violet" />
          </div>
          <div>
            <div className="font-mono text-xs text-text-dim mb-0.5">VAULT CONTRACT</div>
            <a
              href={`https://bscscan.com/address/${CONTRACTS.VAULT}`}
              target="_blank" rel="noopener noreferrer"
              className="font-mono text-sm text-violet hover:text-gold transition-colors flex items-center gap-1"
            >
              {CONTRACTS.VAULT.slice(0, 10)}... <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </motion.div>

      {/* Chart + Action Panel */}
      <div className="grid grid-cols-5 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="card rounded-2xl p-6 col-span-3"
        >
          {/* Yield Info Banner */}
          {vaultData.isStaked && (
            <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)' }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(0,212,170,0.15)' }}>
                  <Zap size={16} className="text-teal" />
                </div>
                <div className="flex-1">
                  <div className="font-display font-semibold text-teal text-sm mb-1">🟢 Earning Yield Now</div>
                  <div className="text-xs text-text-dim leading-relaxed">
                    Your BNB is staked in <span className="text-teal font-semibold">AsterEarn</span>, which deploys to <span className="text-teal font-semibold">Lista DAO</span>. 
                    Yield comes from <span className="font-semibold">Binance Launchpool</span> rewards (8-30% APY). 
                    Yield updates every few hours as rewards are distributed.
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs font-mono">
                    <span className="text-text-dim">Vault holds: <span className="text-gold">{parseFloat(vaultData.asBNBBalanceFormatted).toFixed(6)} asBNB</span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="font-mono text-xs text-text-dim mb-1">VAULT VALUE GROWTH</div>
              <div className="font-display font-semibold text-text">Real-time from blockchain</div>
            </div>
            <span className="pill text-teal" style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}>
              LIVE
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mockYieldData}>
              <defs>
                <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F0B429" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F0B429" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,40,64,0.8)" />
              <XAxis dataKey="day" stroke="#3D5A80" tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10 }} />
              <YAxis stroke="#3D5A80" tick={{ fontFamily: 'IBM Plex Mono', fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  background: '#0F1F38', border: '1px solid #162840',
                  borderRadius: '12px', fontFamily: 'IBM Plex Mono', fontSize: '11px'
                }}
                formatter={(v) => [v.toFixed(6), 'Rate']}
              />
              <Area type="monotone" dataKey="value" stroke="#F0B429" strokeWidth={2} fill="url(#yieldGrad)" />
            </AreaChart>
          </ResponsiveContainer>

          {/* AsterEarn contracts */}
          <div className="mt-4 pt-4 border-t border-rim grid grid-cols-2 gap-3">
            {[
              { label: 'asBNB Minting', addr: CONTRACTS.ASBNB_MINTING },
              { label: 'asBNB Token', addr: CONTRACTS.ASBNB_TOKEN },
            ].map(({ label, addr }) => (
              <div key={label}>
                <div className="font-mono text-xs text-text-dim mb-0.5">{label}</div>
                <a href={`https://bscscan.com/address/${addr}`} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-xs text-gold hover:underline flex items-center gap-1">
                  {addr.slice(0, 14)}... <ExternalLink size={10} />
                </a>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="col-span-2 card rounded-2xl p-6"
        >
          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden mb-6"
            style={{ background: '#060C18', border: '1px solid #162840' }}>
            {['deposit', 'withdraw'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setTxHash(null); setTxError(null) }}
                className={`flex-1 py-2.5 text-sm font-display font-semibold transition-all cursor-pointer ${
                  tab === t
                    ? 'bg-gold text-void rounded-xl'
                    : 'text-text-dim hover:text-text'
                }`}
              >
                {t === 'deposit' ? '⬇ Deposit' : '⬆ Withdraw'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'deposit' ? (
              <motion.div key="deposit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-4">
                  <div className="font-mono text-xs text-text-dim mb-2">AMOUNT (BNB)</div>
                  <div className="relative">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="input-field w-full rounded-xl px-4 py-3 text-lg"
                    />
                    <button
                      onClick={() => setDepositAmount((parseFloat(wallet.balance) * 0.99).toFixed(4))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-gold hover:text-gold-dim cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>
                  <div className="font-mono text-xs text-text-dim mt-1.5">
                    Wallet: {parseFloat(wallet.balance).toFixed(4)} BNB
                  </div>
                </div>

                <div className="card rounded-xl p-3 mb-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-text-dim">
                    <span>Yield Source</span><span className="text-gold">AsterDEX Earn (asBNB)</span>
                  </div>
                  <div className="flex justify-between text-text-dim">
                    <span>Shares (avBNB)</span><span className="text-text">~{depositAmount || '0'}</span>
                  </div>
                  <div className="flex justify-between text-text-dim">
                    <span>Performance Fee</span><span className="text-text">0.5% on profit only</span>
                  </div>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={txLoading || !depositAmount}
                  className="btn-gold w-full py-4 rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {txLoading ? '⏳ Depositing...' : '⬇ Deposit to AsterVault'}
                </button>
              </motion.div>
            ) : (
              <motion.div key="withdraw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-4">
                  <div className="font-mono text-xs text-text-dim mb-2">SHARES TO REDEEM (avBNB)</div>
                  <div className="relative">
                    <input
                      type="number"
                      value={withdrawShares}
                      onChange={e => setWithdrawShares(e.target.value)}
                      placeholder="0.00"
                      step="0.001"
                      min="0"
                      className="input-field w-full rounded-xl px-4 py-3 text-lg"
                    />
                    <button
                      onClick={() => setWithdrawShares(vaultData.userShares)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-gold hover:text-gold-dim cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>
                  <div className="font-mono text-xs text-text-dim mt-1.5">
                    Your shares: {parseFloat(vaultData.userShares).toFixed(6)} avBNB
                  </div>
                </div>

                <div className="card rounded-xl p-3 mb-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-text-dim">
                    <span>Your Value</span>
                    <span className="text-gold"><FormatBNB value={vaultData.userValueBNB} /></span>
                  </div>
                  <div className="flex justify-between text-text-dim">
                    <span>Yield Earned</span>
                    <span className="text-teal"><FormatBNB value={vaultData.userYieldBNB} /></span>
                  </div>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={txLoading || !withdrawShares}
                  className="w-full py-4 rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 font-display font-bold"
                  style={{ background: 'linear-gradient(135deg, #00D4AA, #7C3AED)', color: 'white' }}
                >
                  {txLoading ? '⏳ Withdrawing...' : '⬆ Withdraw BNB'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TX feedback */}
          <AnimatePresence>
            {txHash && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3 rounded-xl"
                style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)' }}
              >
                <div className="font-mono text-xs text-teal mb-1">✅ Transaction confirmed</div>
                <a
                  href={`https://bscscan.com/tx/${txHash}`}
                  target="_blank" rel="noopener noreferrer"
                  className="font-mono text-xs text-text-dim hover:text-gold flex items-center gap-1"
                >
                  {txHash.slice(0, 20)}... <ExternalLink size={10} />
                </a>
              </motion.div>
            )}
            {txError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <div className="font-mono text-xs text-danger">❌ {txError}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}