const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying AsterVault to BNB Chain...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB\n");

  const AsterVault = await ethers.getContractFactory("AsterVault");
  const vault = await AsterVault.deploy();
  await vault.waitForDeployment();

  const address = await vault.getAddress();
  console.log("✅ AsterVault deployed at:", address);
  console.log("🔗 BSCScan:", `https://bscscan.com/address/${address}`);
  console.log("\n📋 Add to frontend/.env:");
  console.log(`VITE_VAULT_ADDRESS=${address}`);
  console.log(`VITE_CHAIN_ID=56`);

  // Log AsterEarn contract references
  console.log("\n🏦 AsterEarn Contracts:");
  console.log("  asBNB Minting:  0x2F31ab8950c50080E77999fa456372f276952fD8");
  console.log("  asBNB Token:    0x77734e70b6E88b4d82fE632a168EDf6e700912b6");
  console.log("  asUSDF Minting: 0xdB57a53C428a9faFcbFefFB6dd80d0f427543695");
  console.log("  USDF Token:     0x5A110fC00474038f6c02E89C707D638602EA44B5");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
