import { motion } from 'framer-motion'
import { Shield, Zap, Layers, RefreshCw, ArrowRight } from 'lucide-react'

const pillars = [
  { icon: Zap, label: 'INTEGRATE', desc: 'AsterEarn as primary yield source', color: 'text-gold', bg: 'rgba(240,180,41,0.08)', border: 'rgba(240,180,41,0.2)' },
  { icon: Layers, label: 'STACK', desc: 'Yield re-deployed to maximize returns', color: 'text-teal', bg: 'rgba(0,212,170,0.08)', border: 'rgba(0,212,170,0.2)' },
  { icon: RefreshCw, label: 'AUTOMATE', desc: 'Fully programmatic, keeper-triggered', color: 'text-violet', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' },
  { icon: Shield, label: 'PROTECT', desc: '100% non-custodial, no admin keys', color: 'text-teal', bg: 'rgba(0,212,170,0.08)', border: 'rgba(0,212,170,0.2)' },
]

export default function HeroSection({ onConnect, isConnecting }) {
  return (
    <div className="flex flex-col items-center text-center py-20">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 font-mono text-xs text-gold"
        style={{ background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)' }}
      >
        <span className="w-2 h-2 rounded-full bg-gold pulse-dot inline-block" />
        POWERED BY ASTERDEX EARN · BNB CHAIN
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="font-display text-6xl font-bold leading-tight mb-6 max-w-3xl"
      >
        Autonomous Yield,
        <br />
        <span className="gradient-gold">Zero Compromise</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="text-text-dim text-xl max-w-xl mb-10 leading-relaxed"
      >
        Deposit BNB → AsterVault deploys to AsterEarn, auto-compounds yield, and stacks returns on PancakeSwap. No admin keys. No multisig. Fully onchain.
      </motion.p>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={onConnect}
        disabled={isConnecting}
        className="btn-gold px-10 py-4 rounded-xl text-base cursor-pointer flex items-center gap-2 disabled:opacity-60"
      >
        {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
        <ArrowRight size={18} />
      </motion.button>

      {/* 4 Pillars */}
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="grid grid-cols-4 gap-4 mt-20 w-full max-w-4xl"
      >
        {pillars.map(({ icon: Icon, label, desc, color, bg, border }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
            whileHover={{ y: -4 }}
            className="card rounded-xl p-5 text-left"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
              style={{ background: bg, border: `1px solid ${border}` }}>
              <Icon size={18} className={color} />
            </div>
            <div className={`font-mono text-xs font-semibold mb-1 ${color}`}>{label}</div>
            <div className="text-xs text-text-dim leading-relaxed">{desc}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="card rounded-2xl p-6 mt-8 w-full max-w-4xl grid grid-cols-3 gap-6 gold-border"
      >
        {[
          { label: 'Primary Yield Source', value: 'AsterEarn asBNB' },
          { label: 'Yield Stacking', value: 'PancakeSwap LP' },
          { label: 'Architecture', value: '100% Non-Custodial' },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="font-mono text-xs text-text-dim mb-1">{label}</div>
            <div className="font-display font-semibold text-gold">{value}</div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
