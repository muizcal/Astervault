export const ASBNB_TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

export const ASTERVAULT_ABI = [
  // Read functions
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function totalDeposited() view returns (uint256)",
  "function totalVaultValueBNB() view returns (uint256)",
  "function userValueBNB(address) view returns (uint256)",
  "function userYieldBNB(address) view returns (uint256)",
  "function userDeposited(address) view returns (uint256)",
  "function estimatedAPY() view returns (uint256)",
  "function nextCompoundIn() view returns (uint256)",
  "function vaultAsBNBBalance() view returns (uint256)",
  "function activeStrategy() view returns (uint8)",
  "function lastCompoundTimestamp() view returns (uint256)",
  "function accumulatedFees() view returns (uint256)",
  "function compoundCooldown() view returns (uint256)",

  // Write functions
  "function deposit() payable",
  "function withdraw(uint256 shares)",
  "function compound()",
  "function rotateStrategy()",

  // Events
  "event Deposited(address indexed user, uint256 bnbAmount, uint256 sharesIssued)",
  "event Withdrawn(address indexed user, uint256 shares, uint256 bnbReturned)",
  "event Compounded(uint256 yieldHarvested, uint256 newPrincipal, uint8 strategy)",
  "event StrategyRotated(uint8 oldStrategy, uint8 newStrategy)",
];

// BNB Chain Contract Addresses
export const CONTRACTS = {
  // Deploy your AsterVault here after running: npx hardhat run scripts/deploy.js --network bnb
  VAULT: import.meta.env.VITE_VAULT_ADDRESS || "0x0000000000000000000000000000000000000000",

  // AsterEarn Official Contracts (BNB Chain)
  ASBNB_MINTING:  "0x2F31ab8950c50080E77999fa456372f276952fD8",
  ASBNB_TOKEN:    "0x77734e70b6E88b4d82fE632a168EDf6e700912b6",
  ASUSDF_MINTING: "0xdB57a53C428a9faFcbFefFB6dd80d0f427543695",
  ASUSDF_TOKEN:   "0x917AF46B3C3c6e1Bb7286B9F59637Fb7C65851Fb",
  USDF_TOKEN:     "0x5A110fC00474038f6c02E89C707D638602EA44B5",
};

export const BNB_CHAIN_ID = 56;
export const BNB_CHAIN_CONFIG = {
  chainId: "0x38",
  chainName: "BNB Smart Chain",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: ["https://bsc-dataseed.binance.org/"],
  blockExplorerUrls: ["https://bscscan.com"],
};
