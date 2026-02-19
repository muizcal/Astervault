import { useState } from 'react'
import { useWallet, useVault } from './hooks/useVault'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import VaultDashboard from './components/VaultDashboard'
import HowItWorks from './components/HowItWorks'

export default function App() {
  const wallet = useWallet()
  const vault = useVault(wallet.signer, wallet.address)

  return (
    <div className="min-h-screen bg-void grid-bg">
      {/* Ambient glow orbs */}
      <div className="fixed w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(240,180,41,0.05) 0%, transparent 70%)', top: '-100px', right: '-100px' }} />
      <div className="fixed w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.04) 0%, transparent 70%)', bottom: '0px', left: '-50px' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <Header wallet={wallet} />

        {!wallet.address ? (
          <HeroSection onConnect={wallet.connect} isConnecting={wallet.isConnecting} />
        ) : !wallet.isCorrectChain ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="card rounded-2xl p-8 text-center max-w-md gold-border">
              <div className="text-4xl mb-4">⛓️</div>
              <h2 className="font-display text-xl font-semibold text-text mb-2">Wrong Network</h2>
              <p className="text-text-dim text-sm mb-6">AsterVault runs on BNB Chain. Switch your network to continue.</p>
              <button onClick={wallet.switchToBNB} className="btn-gold px-8 py-3 rounded-xl cursor-pointer w-full">
                Switch to BNB Chain
              </button>
            </div>
          </div>
        ) : (
          <VaultDashboard wallet={wallet} vault={vault} />
        )}

        <HowItWorks />
      </div>
    </div>
  )
}
