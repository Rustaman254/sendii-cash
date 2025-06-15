// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DustAggregator is Ownable {
    address public dexAggregator; // e.g., 1inch router address
    mapping(address => mapping(address => uint256)) public userDust; // user -> token -> amount

    event DustDeposited(address indexed user, address indexed token, uint256 amount);
    event DustSwapped(address indexed user, address indexed tokenOut, uint256 amountOut);

    constructor(address _dexAggregator) Ownable(msg.sender) {
        dexAggregator = _dexAggregator;
    }

    // Deposit dust tokens
    function depositDust(address token, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        userDust[msg.sender][token] += amount;
        emit DustDeposited(msg.sender, token, amount);
    }

    // Swap aggregated dust to a single token (e.g., ETH or USDC)
    function swapDust(address[] memory tokens, address tokenOut) external {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 amount = userDust[msg.sender][tokens[i]];
            if (amount > 0) {
                totalValue += amount; // Mock value aggregation
                userDust[msg.sender][tokens[i]] = 0;
                // In production, call DEX aggregator (e.g., 1inch) to swap tokens[i] to tokenOut
            }
        }
        require(totalValue > 0, "No dust to swap");
        // Mock swap: Transfer tokenOut to user (in production, use DEX aggregator)
        emit DustSwapped(msg.sender, tokenOut, totalValue);
    }

    // Admin function to update DEX aggregator address
    function setDexAggregator(address _dexAggregator) external onlyOwner {
        dexAggregator = _dexAggregator;
    }
}
