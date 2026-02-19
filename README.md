# AsterVault 🏆

> Autonomous, non-custodial yield optimizer powered by AsterDEX Earn on BNB Chain

---

## How It Meets Every Hackathon Requirement

### ✅ INTEGRATE — AsterDEX Earn as Primary Yield Engine
- Users deposit BNB → vault calls `AsterEarn asBNB Minting` contract directly
- Minting Contract: `0x2F31ab8950c50080E77999fa456372f276952fD8`
- asBNB Token: `0x77734e70b6E88b4d82fE632a168EDf6e700912b6`
- **AsterEarn is the ONLY yield source for the base layer**

### ✅ STACK — Yield Compounding + PancakeSwap
- `compound()` harvests AsterEarn yield every 6 hours
- Yield re-minted back into asBNB (compounding) OR
- Routed to PancakeSwap BNB/USDT LP for additional yield stacking
- `rotateStrategy()` switches between modes deterministically

### ✅ AUTOMATE — Fully Programmatic
- `compound()` is **permissionless** — anyone can call it
- Designed for Gelato Network or Chainlink Automation keepers
- **Zero manual buttons, zero multisig, zero off-chain triggers**
- All logic is deterministic and on-chain

### ✅ PROTECT — Non-Custodial & Decentralized
- **No admin keys** — constructor sets everything, no owner functions
- **No upgradability** — immutable contract
- Users hold `avBNB` ERC20 shares directly in their wallet
- Smart contract is the sole source of truth
- Withdraw anytime, directly to your own address

---

## Smart Contracts

| Contract | Address (BNB Chain) |
|---|---|
| AsterVault (deploy yours) | Run `npm run deploy:bnb` |
| AsterEarn asBNB Minting | `0x2F31ab8950c50080E77999fa456372f276952fD8` |
| AsterEarn asBNB Token | `0x77734e70b6E88b4d82fE632a168EDf6e700912b6` |
| AsterEarn asUSDF Minting | `0xdB57a53C428a9faFcbFefFB6dd80d0f427543695` |
| AsterEarn asUSDF Token | `0x917AF46B3C3c6e1Bb7286B9F59637Fb7C65851Fb` |
| USDF Token | `0x5A110fC00474038f6c02E89C707D638602EA44B5` |
| Aster Treasury | `0x128463A60784c4D3f46c23Af3f65Ed859Ba87974` |

---

## Project Structure

```
astervault/
├── contracts/
│   └── AsterVault.sol       ← Core smart contract
├── scripts/
│   └── deploy.js            ← Deployment script
├── hardhat.config.js        ← BNB Chain config
├── package.json             ← Hardhat deps
└── frontend/
    ├── src/
    │   ├── abi/
    │   │   └── contracts.js     ← ABI + contract addresses
    │   ├── hooks/
    │   │   └── useVault.js      ← Wallet + contract hooks
    │   ├── components/
    │   │   ├── Header.jsx       ← Wallet connection header
    │   │   ├── HeroSection.jsx  ← Landing (not connected)
    │   │   ├── VaultDashboard.jsx ← Main deposit/withdraw UI
    │   │   └── HowItWorks.jsx   ← Architecture explainer
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Quick Start

### 1. Deploy the Smart Contract

```bash
# Install
npm install

# Create .env
echo "DEPLOYER_PRIVATE_KEY=your_private_key_here" > .env
echo "BSCSCAN_API_KEY=your_bscscan_key" >> .env

# Deploy to BNB Chain
npm run deploy:bnb

# Or testnet first
npm run deploy:testnet
```

Copy the deployed address and add to `frontend/.env`:
```
VITE_VAULT_ADDRESS=0x...your_deployed_address
```

### 2. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, connect MetaMask to BNB Chain, and start depositing.

---

## Keeper Automation (Gelato)

To automate `compound()` every 6 hours:

1. Go to [app.gelato.network](https://app.gelato.network)
2. Create new task → **Call Contract Function**
3. Contract: `your AsterVault address`
4. Function: `compound()`
5. Trigger: **Time-based** → every 6 hours
6. Fund the task with ETH for gas

Anyone can also call `compound()` manually at any time — it's fully permissionless.

---

## Vault Token: avBNB

- ERC20 vault shares minted on deposit, burned on withdrawal
- `avBNB` price increases as AsterEarn yield accrues
- Share-based accounting: everyone's yield grows proportionally
- Transferable — you can move your position without withdrawing

---

Built for the hackathon · AsterDEX Earn integration · BNB Chain
