import { motion } from 'framer-motion'

const steps = [
  {
    num: '01',
    title: 'You Deposit BNB',
    desc: 'Send BNB to AsterVault. You receive avBNB shares proportional to your deposit. Your keys, your custody — the contract never holds your keys.',
    tag: 'NON-CUSTODIAL',
    color: 'text-gold',
    tagBg: 'rgba(240,180,41,0.08)',
    tagBorder: 'rgba(240,180,41,0.2)',
  },
  {
    num: '02',
    title: 'AsterEarn Generates Yield',
    desc: 'The vault immediately mints asBNB via AsterDEX Earn\'s official minting contract (0x2F31...2fD8). Your BNB starts earning yield from AsterEarn\'s perpetuals trading fees.',
    tag: 'PRIMARY YIELD',
    color: 'text-gold',
    tagBg: 'rgba(240,180,41,0.08)',
    tagBorder: 'rgba(240,180,41,0.2)',
  },
  {
    num: '03',
    title: 'Keeper Auto-Compounds',
    desc: 'A permissionless keeper (Gelato/Chainlink) calls compound() every 6 hours. Yield is harvested, re-minted as asBNB, and optionally stacked into PancakeSwap LPs. No manual buttons. No multisig.',
    tag: 'FULLY AUTOMATED',
    color: 'text-teal',
    tagBg: 'rgba(0,212,170,0.08)',
    tagBorder: 'rgba(0,212,170,0.2)',
  },
  {
    num: '04',
    title: 'Withdraw Anytime',
    desc: 'Burn your avBNB shares and receive BNB + accrued yield directly to your wallet. Smart contract is the sole source of truth. No admin can freeze, pause, or redirect your funds.',
    tag: 'DECENTRALIZED',
    color: 'text-violet',
    tagBg: 'rgba(124,58,237,0.08)',
    tagBorder: 'rgba(124,58,237,0.2)',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-20 border-t border-rim mt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="text-center mb-12"
      >
        <div className="font-mono text-xs text-gold mb-3">ARCHITECTURE</div>
        <h2 className="font-display text-4xl font-bold text-text mb-3">How AsterVault Works</h2>
        <p className="text-text-dim max-w-xl mx-auto">
          Four autonomous layers: Integrate → Stack → Automate → Protect
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-6">
        {steps.map(({ num, title, desc, tag, color, tagBg, tagBorder }, i) => (
          <motion.div
            key={num}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="card rounded-2xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="font-mono text-5xl font-bold text-rim">{num}</div>
              <span
                className="pill"
                style={{ background: tagBg, border: `1px solid ${tagBorder}`, color: color.replace('text-', '') === 'gold' ? '#F0B429' : color.replace('text-', '') === 'teal' ? '#00D4AA' : '#7C3AED' }}
              >
                {tag}
              </span>
            </div>
            <h3 className="font-display text-xl font-semibold text-text mb-2">{title}</h3>
            <p className="text-text-dim text-sm leading-relaxed">{desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Contract addresses table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="card rounded-2xl p-6 mt-8 gold-border"
      >
        <div className="font-mono text-xs text-gold mb-4">VERIFIED CONTRACT ADDRESSES · BNB CHAIN</div>
        <div className="grid grid-cols-2 gap-4 font-mono text-xs">
          {[
            { label: 'AsterEarn asBNB Minting', addr: '0x2F31ab8950c50080E77999fa456372f276952fD8' },
            { label: 'AsterEarn asBNB Token', addr: '0x77734e70b6E88b4d82fE632a168EDf6e700912b6' },
            { label: 'AsterEarn asUSDF Minting', addr: '0xdB57a53C428a9faFcbFefFB6dd80d0f427543695' },
            { label: 'AsterEarn asUSDF Token', addr: '0x917AF46B3C3c6e1Bb7286B9F59637Fb7C65851Fb' },
            { label: 'USDF Token', addr: '0x5A110fC00474038f6c02E89C707D638602EA44B5' },
            { label: 'Aster Treasury', addr: '0x128463A60784c4D3f46c23Af3f65Ed859Ba87974' },
          ].map(({ label, addr }) => (
            <div key={label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#060C18' }}>
              <span className="text-text-dim">{label}</span>
              <a
                href={`https://bscscan.com/address/${addr}`}
                target="_blank" rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                {addr.slice(0, 8)}...{addr.slice(-6)} ↗
              </a>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
