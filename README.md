# AsterVault

Autonomous, non-custodial yield optimizer powered by AsterDEX Earn on BNB Chain.

## Overview

AsterVault is a fully autonomous, non-custodial yield vault that integrates directly with AsterDEX Earn to maximize BNB yields. Users deposit BNB, receive avBNB share tokens, and earn passive yield through automated compounding.

## Contract Addresses

### Production Deployment (PancakeSwap Integration)
- **Vault Contract:** 0x5bf2B777FfaCd9bA8aED17017E19884C7cc8F65e
- **Network:** BNB Chain Mainnet (ChainID: 56)
- **BSCScan:** https://bscscan.com/address/0x5bf2B777FfaCd9bA8aED17017E19884C7cc8F65e
- **Status:** Production-ready with instant withdrawals

### Previous Deployments (Development & Testing)
- **V1 (Lista DAO Integration):** 0x97c13121030374d6B88Cfe6C0E0A9CEEf67eEf73
  - Test Transaction: https://bscscan.com/tx/0x83b6cf06d85c909ca46850d46848e581bcca2f3b6bef4af957f630901e8955f4
  - Issue: 7-day unbonding period created poor user experience
  - Learning: Smart contract immutability requires thorough mainnet testing
  - Solution: Upgraded to PancakeSwap for instant liquidity

### Integrated Protocol Addresses
- **AsterEarn asBNB Minting:** 0x2F31ab8950c50080E77999fa456372f276952fD8
- **AsterEarn asBNB Token:** 0x77734e70b6E88b4d82fE632a168EDf6e700912b6
- **Lista DAO slisBNB Token:** 0xB0b84D294e0C75A6abe60171b70edEb2EFd14A1B
- **PancakeSwap V2 Router:** 0x10ED43C718714eb63d5aA57B78B54704E256024E



### INTEGRATE - AsterEarn as Primary Yield Engine
The vault integrates directly with AsterEarn's minting contract at 0x2F31ab8950c50080E77999fa456372f276952fD8. Every deposit calls `mintAsBnb()` and every withdrawal calls `burnAsBnb()`, making AsterEarn the sole yield source. Real-time vault valuation uses AsterEarn's `convertToTokens()` exchange rate.

**Proof in Code:** Line 247 of AsterVault.sol
```solidity
IAsterEarnMinting(ASBNB_MINTING).mintAsBnb{value: bnbAmount}();
```

### STACK - Yield Compounding Strategy
- **Layer 1:** AsterEarn asBNB earning Binance Launchpool rewards (8-30% APY)
- **Layer 2:** Automated yield harvesting and re-investment every 6 hours
- **Layer 3:** PancakeSwap routing for instant withdrawal liquidity
- **Result:** Compound yield growth with zero waiting periods

### AUTOMATE - Fully Permissionless Operations
The `compound()` function has no access controls - anyone can call it after the 6-hour cooldown. No admin keys, no multisig, no governance. Designed for Gelato Network or Chainlink Automation integration.

**Proof in Code:** Line 216 of AsterVault.sol
```solidity
function compound() external {  // Note: external, not onlyOwner
    require(block.timestamp >= lastCompoundTimestamp + compoundCooldown);
    // ... autonomous compounding logic
}
```

### PROTECT - Non-Custodial Architecture
Zero admin functions. Users hold avBNB ERC20 shares in their own wallets. The withdraw function sends funds directly to msg.sender with no intermediaries. Contract is immutable with no proxy patterns or upgradeability.

## Architecture

### Smart Contract Design

**Core Flow:**
```
Deposit:  BNB → AsterEarn mintAsBnb() → asBNB (vault holds) → avBNB shares (user receives)
Yield:    asBNB exchange rate increases → Vault value grows → APY compounds
Withdraw: avBNB burn → asBNB burn → slisBNB → PancakeSwap swap → BNB (instant)
```

**Key Features:**
- ERC20 share-based accounting prevents dilution attacks
- 0.5% performance fee applies only to profit, never principal
- Minimum deposit: 0.002 BNB 
- 6-hour compound cooldown prevents spam and saves gas

### Withdrawal Evolution

The project demonstrates real-world iterative development. Initial deployment used Lista DAO's native unstaking, requiring 7 days for withdrawals. After mainnet testing (transaction 0x83b6cf06...), this was identified as poor UX. The production version integrates PancakeSwap Router for instant BNB returns with 1% slippage protection.

## Installation

### Prerequisites
- Node.js 18+
- MetaMask with BNB
- Approximately 0.015 BNB for deployment gas

### Deploy Smart Contract

```bash
# Clone and install
git clone https://github.com/muizcal/Astervault.git
cd astervault
npm install

# Configure deployer
echo "DEPLOYER_PRIVATE_KEY=your_private_key" > .env

# Compile and deploy
npx hardhat compile
npx hardhat run scripts/deploy.js --network bnb

# For testing on testnet first
npx hardhat run scripts/deploy.js --network bnbTestnet
```

### Setup Frontend

```bash
cd frontend
npm install

# Configure vault address (use your deployed address)
echo "VITE_VAULT_ADDRESS=YOUR DEPLOYED ADDRESS" > .env
echo "VITE_CHAIN_ID=56" >> .env

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

### For Users

1. Open the application and connect MetaMask to BNB Chain
2. Click Deposit and enter BNB amount (minimum 0.001)
3. Approve transaction - receive avBNB share tokens
4. Monitor yield growth in real-time dashboard
5. Withdraw anytime - receive BNB instantly via PancakeSwap

### For Keepers (Automation)

Anyone can call compound to earn keeper rewards:

```bash
# Using Foundry cast
cast send 0x5bf2B777FfaCd9bA8aED17017E19884C7cc8F65e \
  "compound()" \
  --rpc-url https://bsc.publicnode.com \
  --private-key YOUR_KEEPER_KEY

# Or integrate with Gelato Network for automated execution
```

## Yield Mechanics

### How It Works

1. Deposit BNB → Vault mints asBNB via AsterEarn
2. asBNB earns Binance Launchpool rewards automatically
3. Exchange rate increases (e.g., 1 asBNB = 1.02 BNB after 1 month)
4. Compound harvests yield and re-invests every 6 hours
5. Share price increases → All holders benefit proportionally

### Example Returns

1 BNB deposit at 20% APY with daily compounding:
- Week 1: 1.003835 BNB (+0.38%)
- Month 1: 1.016394 BNB (+1.64%)
- Year 1: 1.221386 BNB (+22.14% with compounding)

### Fee Structure

- Deposit: 0%
- Withdrawal: 0%
- Performance: 0.5% on profit only
- Compound: Gas paid by keeper

## Project Structure

```
astervault/
├── contracts/
│   └── AsterVault.sol              # Main vault contract (304 lines)
├── scripts/
│   └── deploy.js                   # Hardhat deployment script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx          # Wallet connection + disconnect
│   │   │   ├── HeroSection.jsx     # Landing page
│   │   │   ├── VaultDashboard.jsx  # Deposit/withdraw interface
│   │   │   └── HowItWorks.jsx      # Documentation
│   │   ├── hooks/
│   │   │   └── useVault.js         # Web3 integration
│   │   ├── abi/
│   │   │   └── contracts.js        # Contract ABIs
│   │   └── App.jsx
│   └── package.json
├── hardhat.config.js
└── package.json
```

## Technology Stack

**Smart Contracts:**
- Solidity 0.8.20
- Hardhat development environment
- OpenZeppelin patterns

**Frontend:**
- React 18 with Vite
- TailwindCSS for styling
- Framer Motion for animations
- ethers.js v6 for blockchain interaction
- Recharts for data visualization

## Security Considerations

- No admin functions or privileged roles
- Immutable contract (no proxy or upgradeability)
- Share-based accounting prevents inflation
- Direct user custody via ERC20 tokens
- Slippage protection on PancakeSwap swaps
- Open source and auditable code

## Development Process

### Lessons Learned

1. **Smart Contract Immutability:** Once deployed, code cannot be changed. Thorough testing is essential.
2. **Mainnet Testing:** Some issues only appear in production (7-day unbonding period).
3. **User Experience:** Technical solutions must prioritize user needs (instant withdrawals).
4. **Iteration:** Building v1, testing, and improving to v2 is part of DeFi development.

### Testing Evidence

Transaction 0x83b6cf06d85c909ca46850d46848e581bcca2f3b6bef4af957f630901e8955f4 shows the Lista DAO withdrawal test that revealed the 7-day wait issue, leading to the PancakeSwap integration.

## Troubleshooting

**MetaMask won't connect:**
- Ensure you're on BNB Chain (ChainID 56)
- Try refreshing the page
- Check MetaMask is unlocked

**Transaction fails:**
- Verify sufficient BNB for gas
- Ensure deposit meets 0.001 BNB minimum
- Check vault address in .env matches deployment



## Future Enhancements

- Multi-strategy routing (Venus, Alpaca)
- Gelato Network integration for automated compounds
- Historical APY tracking and analytics
- Mobile app (React Native)
- Additional yield source integrations

## Resources

- **Live App:** https://astervault.vercel.app
- **GitHub:** https://github.com/muizcal/Astervault
- **Contract:** https://bscscan.com/address/0x5bf2B777FfaCd9bA8aED17017E19884C7cc8F65e
- **AsterDEX:** https://asterdex.com
- **AsterEarn Docs:** https://docs.asterdex.com/product/aster-earn
- **BNB Chain:** https://docs.bnbchain.org



Built with Solidity, React, and determination.

## License

MIT License - See LICENSE file for details