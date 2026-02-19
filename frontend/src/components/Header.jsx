import { motion } from 'framer-motion'
import { Zap, ExternalLink } from 'lucide-react'

export default function Header({ wallet }) {
  const shortAddr = wallet.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : null

  return (
    <header className="flex items-center justify-between py-6 border-b border-rim">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #F0B429, #C8941F)' }}>
          <Zap size={18} className="text-void" fill="currentColor" />
        </div>
        <div>
          <span className="font-display font-bold text-text text-lg">AsterVault</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal pulse-dot inline-block" />
            <span className="font-mono text-teal text-xs">BNB Chain · AsterEarn</span>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <a href="https://asterdex.com" target="_blank" rel="noopener noreferrer"
          className="btn-ghost px-4 py-2 rounded-lg text-sm cursor-pointer flex items-center gap-1.5">
          AsterDEX <ExternalLink size={12} />
        </a>

        {wallet.address && (
          <>
            <div className="card rounded-xl px-4 py-2 flex items-center gap-3">
              <div>
                <div className="font-mono text-xs text-text-dim">Connected</div>
                <div className="font-mono text-sm text-gold">{shortAddr}</div>
              </div>
              <div className="w-px h-8 bg-rim" />
              <div>
                <div className="font-mono text-xs text-text-dim">Balance</div>
                <div className="font-mono text-sm text-text">{parseFloat(wallet.balance).toFixed(4)} BNB</div>
              </div>
            </div>
            <button 
              onClick={wallet.disconnect}
              className="btn-ghost px-4 py-2 rounded-xl text-sm"
            >
              Disconnect
            </button>
          </>
        )}
      </div>
    </header>
  )
}