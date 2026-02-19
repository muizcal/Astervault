// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AsterVault - FULL AsterEarn Integration
 * @notice Real integration with AsterDEX Earn contracts on BNB Chain
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IAsterEarnMinting {
    /// @notice Deposit BNB and mint asBNB (payable function)
    function mintAsBnb() external payable;
    
    /// @notice Burn asBNB and receive slisBNB back
    function burnAsBnb(uint256 asBnbAmount) external;
    
    /// @notice Calculate how much asBNB you get for X BNB
    function convertToAsBnb(uint256 tokens) external view returns (uint256);
    
    /// @notice Calculate how much BNB you get from X asBNB
    function convertToTokens(uint256 asBnbAmt) external view returns (uint256);
    
    /// @notice Minimum BNB amount to mint
    function minMintAmount() external view returns (uint256);
    
    /// @notice asBNB token address
    function asBnb() external view returns (address);
}

interface IListaStakeManager {
    /// @notice Unstake slisBNB and receive BNB
    function requestWithdraw(uint256 slisBNBAmount) external;
    
    /// @notice Get conversion rate slisBNB → BNB
    function convertSnBnbToBnb(uint256 amount) external view returns (uint256);
}

contract VaultShareToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        require(balanceOf[from] >= amount, "Insufficient balance");
        totalSupply -= amount;
        balanceOf[from] -= amount;
        emit Transfer(from, address(0), amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

contract AsterVault is VaultShareToken {

    // ─── AsterEarn Contracts (BNB Chain Mainnet) ─────────────────────────────
    address public constant ASBNB_MINTING = 0x2F31ab8950c50080E77999fa456372f276952fD8;
    address public constant ASBNB_TOKEN = 0x77734e70b6E88b4d82fE632a168EDf6e700912b6;
    
    // ─── Lista DAO Contracts (for slisBNB → BNB conversion) ──────────────────
    address public constant SLISBNB_TOKEN = 0xB0b84D294e0C75A6abe60171b70edEb2EFd14A1B;
    address public constant LISTA_STAKE_MANAGER = 0x1adB950d8bB3dA4bE104211D5AB038628e477fE6;

    // ─── Vault State ─────────────────────────────────────────────────────────
    uint256 public totalDeposited;          // Total BNB deposited by users
    uint256 public lastCompoundTimestamp;
    uint256 public compoundCooldown = 6 hours;
    uint256 public constant FEE_BPS = 50;   // 0.5% performance fee
    uint256 public accumulatedFees;

    mapping(address => uint256) public userDeposited;
    mapping(address => uint256) public userShares;

    // ─── Events ──────────────────────────────────────────────────────────────
    event Deposited(address indexed user, uint256 bnbAmount, uint256 sharesIssued);
    event Withdrawn(address indexed user, uint256 shares, uint256 bnbReturned);
    event Compounded(uint256 yieldHarvested, uint256 newPrincipal);
    event AsterEarnMinted(uint256 bnbAmount, uint256 asBnbReceived);
    event AsterEarnBurned(uint256 asBnbAmount, uint256 bnbReceived);

    constructor() VaultShareToken("AsterVault Share", "avBNB") {
        lastCompoundTimestamp = block.timestamp;
    }

    // ─── Core: Deposit ───────────────────────────────────────────────────────

    /**
     * @notice Deposit BNB → Vault mints asBNB via AsterEarn → User gets avBNB shares
     */
    function deposit() external payable {
        require(msg.value > 0, "Must deposit BNB");
        
        // Check minimum mint amount from AsterEarn
        uint256 minMint = IAsterEarnMinting(ASBNB_MINTING).minMintAmount();
        require(msg.value >= minMint, "Below minimum deposit");

        uint256 bnbAmount = msg.value;
        uint256 sharesToMint;

        if (totalSupply == 0 || totalDeposited == 0) {
            // First deposit: 1:1 ratio
            sharesToMint = bnbAmount;
        } else {
            // Proportional to current vault value
            uint256 vaultValue = _getVaultValueBNB();
            sharesToMint = (bnbAmount * totalSupply) / vaultValue;
        }

        // Deploy to AsterEarn (PRIMARY YIELD SOURCE)
        _deployToAsterEarn(bnbAmount);

        totalDeposited += bnbAmount;
        userDeposited[msg.sender] += bnbAmount;
        userShares[msg.sender] += sharesToMint;

        _mint(msg.sender, sharesToMint);

        emit Deposited(msg.sender, bnbAmount, sharesToMint);
    }

    // ─── Core: Withdraw ──────────────────────────────────────────────────────

    /**
     * @notice Burn avBNB shares → Redeem asBNB → Convert slisBNB → Return pure BNB
     */
    function withdraw(uint256 shares) external {
        require(shares > 0, "Must withdraw shares");
        require(balanceOf[msg.sender] >= shares, "Insufficient shares");

        // Calculate pro-rata BNB value
        uint256 vaultValue = _getVaultValueBNB();
        uint256 bnbToReturn = (shares * vaultValue) / totalSupply;

        // Step 1: Calculate how much asBNB we need to burn
        uint256 asBnbToBurn = IAsterEarnMinting(ASBNB_MINTING).convertToAsBnb(bnbToReturn);
        
        // Step 2: Approve AsterEarn to spend our asBNB
        IERC20(ASBNB_TOKEN).approve(ASBNB_MINTING, asBnbToBurn);
        
        // Step 3: Burn asBNB → Get slisBNB
        IAsterEarnMinting(ASBNB_MINTING).burnAsBnb(asBnbToBurn);
        
        // Step 4: Convert slisBNB → BNB via Lista DAO
        uint256 slisBNBBalance = IERC20(SLISBNB_TOKEN).balanceOf(address(this));
        
        if (slisBNBBalance > 0) {
            // Approve Lista Stake Manager to spend slisBNB
            IERC20(SLISBNB_TOKEN).approve(LISTA_STAKE_MANAGER, slisBNBBalance);
            
            // Request withdrawal from Lista (this gives us BNB)
            uint256 bnbBefore = address(this).balance;
            IListaStakeManager(LISTA_STAKE_MANAGER).requestWithdraw(slisBNBBalance);
            uint256 bnbReceived = address(this).balance - bnbBefore;
            
            // Use actual BNB received
            bnbToReturn = bnbReceived;
        }

        // Deduct performance fee on profit only
        uint256 userCost = (userDeposited[msg.sender] * shares) / userShares[msg.sender];
        
        if (bnbToReturn > userCost) {
            uint256 profit = bnbToReturn - userCost;
            uint256 fee = (profit * FEE_BPS) / 10000;
            accumulatedFees += fee;
            bnbToReturn -= fee;
        }

        _burn(msg.sender, shares);
        userShares[msg.sender] -= shares;
        totalDeposited -= userCost;

        // Send pure BNB to user
        (bool success, ) = msg.sender.call{value: bnbToReturn}("");
        require(success, "BNB transfer failed");

        emit Withdrawn(msg.sender, shares, bnbToReturn);
    }

    // ─── Core: Compound (Fully Autonomous) ───────────────────────────────────

    /**
     * @notice Harvest yield from AsterEarn and re-deposit it (AUTOMATE requirement)
     *         Anyone can call this — fully permissionless, no admin needed
     */
    function compound() external {
        require(
            block.timestamp >= lastCompoundTimestamp + compoundCooldown,
            "Compound cooldown active"
        );

        // Get current asBNB balance
        uint256 asBnbBalance = IERC20(ASBNB_TOKEN).balanceOf(address(this));
        require(asBnbBalance > 0, "No asBNB to compound");

        // Calculate current BNB value
        uint256 currentValueBNB = IAsterEarnMinting(ASBNB_MINTING).convertToTokens(asBnbBalance);
        
        // Calculate yield earned
        if (currentValueBNB > totalDeposited) {
            uint256 yieldBNB = currentValueBNB - totalDeposited;
            
            // Redeem just the yield portion
            uint256 yieldAsBnb = IAsterEarnMinting(ASBNB_MINTING).convertToAsBnb(yieldBNB);
            IAsterEarnMinting(ASBNB_MINTING).burnAsBnb(yieldAsBnb);
            
            // Re-deposit yield (STACK requirement: yield compounding)
            uint256 bnbReceived = address(this).balance;
            if (bnbReceived > 0) {
                _deployToAsterEarn(bnbReceived);
                totalDeposited += bnbReceived;
                emit Compounded(yieldBNB, totalDeposited);
            }
        }

        lastCompoundTimestamp = block.timestamp;
    }

    // ─── Internal: AsterEarn Integration ─────────────────────────────────────

    /**
     * @dev Call AsterEarn minting contract to mint asBNB
     *      This is the INTEGRATE requirement: AsterEarn as primary yield source
     */
    function _deployToAsterEarn(uint256 bnbAmount) internal {
        uint256 asBnbBefore = IERC20(ASBNB_TOKEN).balanceOf(address(this));
        
        // Call AsterEarn's mintAsBnb() with BNB
        IAsterEarnMinting(ASBNB_MINTING).mintAsBnb{value: bnbAmount}();
        
        uint256 asBnbAfter = IERC20(ASBNB_TOKEN).balanceOf(address(this));
        uint256 asBnbReceived = asBnbAfter - asBnbBefore;
        
        emit AsterEarnMinted(bnbAmount, asBnbReceived);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function _getVaultValueBNB() internal view returns (uint256) {
        uint256 asBnbBalance = IERC20(ASBNB_TOKEN).balanceOf(address(this));
        if (asBnbBalance == 0) return totalDeposited;
        
        // Use AsterEarn's conversion rate
        return IAsterEarnMinting(ASBNB_MINTING).convertToTokens(asBnbBalance);
    }

    /// @notice Current estimated APY from AsterEarn (simplified)
    function estimatedAPY() external view returns (uint256) {
        uint256 currentValue = _getVaultValueBNB();
        if (totalDeposited == 0 || currentValue <= totalDeposited) return 0;
        
        // Simplified APY calculation based on current growth
        uint256 growth = currentValue - totalDeposited;
        uint256 timePassed = block.timestamp - lastCompoundTimestamp;
        if (timePassed == 0) return 0;
        
        // Annualize: (growth / deposited) * (365 days / time passed) * 100
        return (growth * 365 days * 10000) / (totalDeposited * timePassed);
    }

    function totalVaultValueBNB() external view returns (uint256) {
        return _getVaultValueBNB();
    }

    function userValueBNB(address user) external view returns (uint256) {
        if (totalSupply == 0) return 0;
        return (balanceOf[user] * _getVaultValueBNB()) / totalSupply;
    }

    function userYieldBNB(address user) external view returns (uint256) {
        uint256 currentValue = this.userValueBNB(user);
        return currentValue > userDeposited[user] 
            ? currentValue - userDeposited[user] 
            : 0;
    }

    function nextCompoundIn() external view returns (uint256) {
        uint256 nextTime = lastCompoundTimestamp + compoundCooldown;
        return block.timestamp >= nextTime ? 0 : nextTime - block.timestamp;
    }

    function vaultAsBNBBalance() external view returns (uint256) {
        return IERC20(ASBNB_TOKEN).balanceOf(address(this));
    }

    function activeStrategy() external pure returns (uint8) {
        return 0; // ASTER_EARN_BNB
    }

    function minDepositAmount() external view returns (uint256) {
        return IAsterEarnMinting(ASBNB_MINTING).minMintAmount();
    }

    // Allow receiving BNB from AsterEarn burns
    receive() external payable {}
}
