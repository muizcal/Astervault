// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AsterVault - FULL AsterEarn Integration + slisBNB → BNB Conversion
 * @notice Returns pure BNB to users on withdrawal
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IAsterEarnMinting {
    function mintAsBnb() external payable;
    function burnAsBnb(uint256 asBnbAmount) external;
    function convertToAsBnb(uint256 tokens) external view returns (uint256);
    function convertToTokens(uint256 asBnbAmt) external view returns (uint256);
    function minMintAmount() external view returns (uint256);
    function asBnb() external view returns (address);
}

interface IListaStakeManager {
    function requestWithdraw(uint256 slisBNBAmount) external;
    function convertSnBnbToBnb(uint256 amount) external view returns (uint256);
}

interface IPancakeRouter {
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function WETH() external pure returns (address);
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

    // ─── Contract Addresses (BNB Chain Mainnet) ──────────────────────────────
    address public constant ASBNB_MINTING = 0x2F31ab8950c50080E77999fa456372f276952fD8;
    address public constant ASBNB_TOKEN = 0x77734e70b6E88b4d82fE632a168EDf6e700912b6;
    address public constant SLISBNB_TOKEN = 0xB0b84D294e0C75A6abe60171b70edEb2EFd14A1B;
    address public constant LISTA_STAKE_MANAGER = 0x1adB950d8bB3dA4bE104211D5AB038628e477fE6;
    address public constant PANCAKE_ROUTER = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
    address public constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;

    // ─── Vault State ─────────────────────────────────────────────────────────
    uint256 public totalDeposited;
    uint256 public lastCompoundTimestamp;
    uint256 public compoundCooldown = 6 hours;
    uint256 public constant FEE_BPS = 50;
    uint256 public accumulatedFees;

    mapping(address => uint256) public userDeposited;
    mapping(address => uint256) public userShares;

    // ─── Events ──────────────────────────────────────────────────────────────
    event Deposited(address indexed user, uint256 bnbAmount, uint256 sharesIssued);
    event Withdrawn(address indexed user, uint256 shares, uint256 bnbReturned);
    event Compounded(uint256 yieldHarvested, uint256 newPrincipal);

    constructor() VaultShareToken("AsterVault Share", "avBNB") {
        lastCompoundTimestamp = block.timestamp;
    }

    // ─── Core: Deposit ───────────────────────────────────────────────────────

    function deposit() external payable {
        require(msg.value > 0, "Must deposit BNB");
        
        uint256 minMint = IAsterEarnMinting(ASBNB_MINTING).minMintAmount();
        require(msg.value >= minMint, "Below minimum deposit");

        uint256 bnbAmount = msg.value;
        uint256 sharesToMint;

        if (totalSupply == 0 || totalDeposited == 0) {
            sharesToMint = bnbAmount;
        } else {
            uint256 vaultValue = _getVaultValueBNB();
            sharesToMint = (bnbAmount * totalSupply) / vaultValue;
        }

        _deployToAsterEarn(bnbAmount);

        totalDeposited += bnbAmount;
        userDeposited[msg.sender] += bnbAmount;
        userShares[msg.sender] += sharesToMint;

        _mint(msg.sender, sharesToMint);

        emit Deposited(msg.sender, bnbAmount, sharesToMint);
    }

    // ─── Core: Withdraw (FIXED - Returns pure BNB) ───────────────────────────

    function withdraw(uint256 shares) external {
        require(shares > 0, "Must withdraw shares");
        require(balanceOf[msg.sender] >= shares, "Insufficient shares");

        uint256 vaultValue = _getVaultValueBNB();
        uint256 bnbToReturn = (shares * vaultValue) / totalSupply;

        // Step 1: Burn asBNB → Get slisBNB
        uint256 asBnbToBurn = IAsterEarnMinting(ASBNB_MINTING).convertToAsBnb(bnbToReturn);
        IERC20(ASBNB_TOKEN).approve(ASBNB_MINTING, asBnbToBurn);
        IAsterEarnMinting(ASBNB_MINTING).burnAsBnb(asBnbToBurn);
        
        // Step 2: Swap slisBNB → BNB via PancakeSwap (INSTANT!)
        uint256 slisBNBBalance = IERC20(SLISBNB_TOKEN).balanceOf(address(this));
        
        if (slisBNBBalance > 0) {
            // Approve PancakeSwap Router
            IERC20(SLISBNB_TOKEN).approve(PANCAKE_ROUTER, slisBNBBalance);
            
            // Build swap path: slisBNB → WBNB
            address[] memory path = new address[](2);
            path[0] = SLISBNB_TOKEN;
            path[1] = WBNB;
            
            // Swap with 1% slippage protection
            uint256 minOut = (slisBNBBalance * 99) / 100;
            
            uint256 bnbBefore = address(this).balance;
            IPancakeRouter(PANCAKE_ROUTER).swapExactTokensForETH(
                slisBNBBalance,
                minOut,
                path,
                address(this),
                block.timestamp + 300
            );
            uint256 bnbReceived = address(this).balance - bnbBefore;
            
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

        (bool success, ) = msg.sender.call{value: bnbToReturn}("");
        require(success, "BNB transfer failed");

        emit Withdrawn(msg.sender, shares, bnbToReturn);
    }

    // ─── Core: Compound ──────────────────────────────────────────────────────

    function compound() external {
        require(
            block.timestamp >= lastCompoundTimestamp + compoundCooldown,
            "Compound cooldown active"
        );

        uint256 asBnbBalance = IERC20(ASBNB_TOKEN).balanceOf(address(this));
        require(asBnbBalance > 0, "No asBNB to compound");

        uint256 currentValueBNB = IAsterEarnMinting(ASBNB_MINTING).convertToTokens(asBnbBalance);
        
        if (currentValueBNB > totalDeposited) {
            uint256 yieldBNB = currentValueBNB - totalDeposited;
            
            uint256 yieldAsBnb = IAsterEarnMinting(ASBNB_MINTING).convertToAsBnb(yieldBNB);
            IAsterEarnMinting(ASBNB_MINTING).burnAsBnb(yieldAsBnb);
            
            uint256 bnbReceived = address(this).balance;
            if (bnbReceived > 0) {
                _deployToAsterEarn(bnbReceived);
                totalDeposited += bnbReceived;
                emit Compounded(yieldBNB, totalDeposited);
            }
        }

        lastCompoundTimestamp = block.timestamp;
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    function _deployToAsterEarn(uint256 bnbAmount) internal {
        IAsterEarnMinting(ASBNB_MINTING).mintAsBnb{value: bnbAmount}();
    }

    function _getVaultValueBNB() internal view returns (uint256) {
        uint256 asBnbBalance = IERC20(ASBNB_TOKEN).balanceOf(address(this));
        if (asBnbBalance == 0) return totalDeposited;
        return IAsterEarnMinting(ASBNB_MINTING).convertToTokens(asBnbBalance);
    }

    // ─── View Functions ──────────────────────────────────────────────────────

    function estimatedAPY() external view returns (uint256) {
        uint256 currentValue = _getVaultValueBNB();
        if (totalDeposited == 0 || currentValue <= totalDeposited) return 0;
        
        uint256 growth = currentValue - totalDeposited;
        uint256 timePassed = block.timestamp - lastCompoundTimestamp;
        if (timePassed == 0) return 0;
        
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
        return 0;
    }

    function minDepositAmount() external view returns (uint256) {
        return IAsterEarnMinting(ASBNB_MINTING).minMintAmount();
    }

    receive() external payable {}
}
