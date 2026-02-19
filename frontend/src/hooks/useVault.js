import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ASTERVAULT_ABI, ASBNB_TOKEN_ABI, CONTRACTS, BNB_CHAIN_ID, BNB_CHAIN_CONFIG } from "../abi/contracts";

export function useWallet() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isCorrectChain = chainId === BNB_CHAIN_ID;

  const connect = useCallback(async () => {
    console.log("🔌 Connect button clicked!");
    
    if (!window.ethereum) {
      console.error("❌ MetaMask not found!");
      setError("MetaMask not found. Please install it.");
      alert("MetaMask not found! Please install the MetaMask browser extension.");
      return;
    }
    
    console.log("✅ MetaMask detected");
    setIsConnecting(true);
    setError(null);
    
    try {
      console.log("📡 Requesting accounts...");
      const _provider = new ethers.BrowserProvider(window.ethereum);
      await _provider.send("eth_requestAccounts", []);
      
      console.log("👤 Getting signer...");
      const _signer = await _provider.getSigner();
      const _address = await _signer.getAddress();
      const network = await _provider.getNetwork();

      console.log("✅ Connected:", _address);
      console.log("🌐 Network:", network.chainId);

      setProvider(_provider);
      setSigner(_signer);
      setAddress(_address);
      setChainId(Number(network.chainId));

      const bal = await _provider.getBalance(_address);
      setBalance(ethers.formatEther(bal));
    } catch (e) {
      console.error("❌ Connection error:", e);
      setError(e.message);
      alert("Connection failed: " + e.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const switchToBNB = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }],
      });
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [BNB_CHAIN_CONFIG],
        });
      }
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (provider && address) {
      const bal = await provider.getBalance(address);
      setBalance(ethers.formatEther(bal));
    }
  }, [provider, address]);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleChainChange = (id) => setChainId(Number(id));
    const handleAccountChange = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        setSigner(null);
      } else {
        connect();
      }
    };
    window.ethereum.on("chainChanged", handleChainChange);
    window.ethereum.on("accountsChanged", handleAccountChange);
    return () => {
      window.ethereum.removeListener("chainChanged", handleChainChange);
      window.ethereum.removeListener("accountsChanged", handleAccountChange);
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setChainId(null);
    setBalance("0");
    console.log("🔌 Disconnected");
  }, []);

  return { provider, signer, address, chainId, balance, isCorrectChain, isConnecting, error, connect, switchToBNB, refreshBalance, disconnect };
}

export function useVault(signer, address) {
  const [vaultData, setVaultData] = useState({
    totalValueBNB: "0",
    userValueBNB: "0",
    userYieldBNB: "0",
    userDeposited: "0",
    userShares: "0",
    estimatedAPY: "0",
    nextCompoundIn: 0,
    asBNBBalance: "0",
    asBNBBalanceFormatted: "0",
    exchangeRate: "0",
    activeStrategy: 0,
    isStaked: false,
    loading: true,
  });

  const contract = signer
    ? new ethers.Contract(CONTRACTS.VAULT, ASTERVAULT_ABI, signer)
    : null;

  const asBNBContract = signer
    ? new ethers.Contract(CONTRACTS.ASBNB_TOKEN, ASBNB_TOKEN_ABI, signer)
    : null;

  const readContract = useCallback(async () => {
    if (!contract || !address) return;
    try {
      const [
        totalVal, userVal, userYield, userDep, userShr,
        apy, nextComp, asbnb, strategy,
      ] = await Promise.all([
        contract.totalVaultValueBNB(),
        contract.userValueBNB(address),
        contract.userYieldBNB(address),
        contract.userDeposited(address),
        contract.balanceOf(address),
        contract.estimatedAPY(),
        contract.nextCompoundIn(),
        contract.vaultAsBNBBalance(),
        contract.activeStrategy(),
      ]);

      // Read asBNB token balance from token contract directly
      const vaultAddress = await contract.getAddress();
      const asBNBRaw = await asBNBContract.balanceOf(vaultAddress);
      
      setVaultData({
        totalValueBNB: ethers.formatEther(totalVal),
        userValueBNB: ethers.formatEther(userVal),
        userYieldBNB: ethers.formatEther(userYield),
        userDeposited: ethers.formatEther(userDep),
        userShares: ethers.formatEther(userShr),
        estimatedAPY: (Number(apy) / 100).toFixed(2),
        nextCompoundIn: Number(nextComp),
        asBNBBalance: ethers.formatEther(asbnb),
        asBNBBalanceFormatted: ethers.formatEther(asBNBRaw),
        exchangeRate: Number(totalVal) > 0 ? (Number(totalVal) / Number(asbnb)).toFixed(6) : "1.000000",
        activeStrategy: Number(strategy),
        isStaked: Number(asBNBRaw) > 0,
        loading: false,
      });
    } catch (e) {
      console.error("Vault read error:", e);
      setVaultData(prev => ({ ...prev, loading: false }));
    }
  }, [contract, address, asBNBContract]);

  useEffect(() => {
    readContract();
    const interval = setInterval(readContract, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [readContract]);

  const deposit = useCallback(async (bnbAmount) => {
    if (!contract) throw new Error("Not connected");
    const value = ethers.parseEther(bnbAmount.toString());
    const tx = await contract.deposit({ value });
    await tx.wait();
    await readContract();
    return tx.hash;
  }, [contract, readContract]);

  const withdraw = useCallback(async (shares) => {
    if (!contract) throw new Error("Not connected");
    const sharesWei = ethers.parseEther(shares.toString());
    const tx = await contract.withdraw(sharesWei);
    await tx.wait();
    await readContract();
    return tx.hash;
  }, [contract, readContract]);

  const compound = useCallback(async () => {
    if (!contract) throw new Error("Not connected");
    const tx = await contract.compound();
    await tx.wait();
    await readContract();
    return tx.hash;
  }, [contract, readContract]);

  return { vaultData, deposit, withdraw, compound, refresh: readContract };
}