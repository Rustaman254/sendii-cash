// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract DustAggregator {
    using SafeERC20 for IERC20;
    using Address for address payable;

    mapping(address => mapping(address => uint256)) public userDust;

    event DustDeposited(address indexed user, address indexed token, uint256 amount);
    event DustSwapped(address indexed user, address indexed tokenOut, uint256 amount);
    event DustBatchDeposited(address indexed user, address[] tokens, uint256[] amounts);

    function depositDust(address token, uint256 amount) external payable {
        if (token == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
            userDust[msg.sender][token] += amount;
            emit DustDeposited(msg.sender, token, amount);
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            userDust[msg.sender][token] += amount;
            emit DustDeposited(msg.sender, token, amount);
        }
    }

    function depositDustBatch(address[] calldata tokens, uint256[] calldata amounts) external payable {
        require(tokens.length == amounts.length, "Arrays length mismatch");
        uint256 ethAmount = 0;

        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == address(0)) {
                ethAmount += amounts[i];
                userDust[msg.sender][tokens[i]] += amounts[i];
            } else {
                IERC20(tokens[i]).safeTransferFrom(msg.sender, address(this), amounts[i]);
                userDust[msg.sender][tokens[i]] += amounts[i];
            }
        }

        require(msg.value == ethAmount, "Incorrect ETH amount");
        emit DustBatchDeposited(msg.sender, tokens, amounts);
    }

    function swapDust(address[] calldata tokens, address tokenOut) external {
        uint256 totalOut = 0;
        for (uint256 i = 0; i < tokens.length; i++) {
            totalOut += userDust[msg.sender][tokens[i]];
            userDust[msg.sender][tokens[i]] = 0;
        }
        userDust[msg.sender][tokenOut] += totalOut;
        emit DustSwapped(msg.sender, tokenOut, totalOut);
    }
}