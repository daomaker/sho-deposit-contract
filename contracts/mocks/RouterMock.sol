// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RouterMock  {
    uint8 _decimals;

    function swap(
        IERC20 tokenIn,
        IERC20 tokenOut,
        uint amountIn,
        uint amountOut
    ) external {
        tokenIn.transferFrom(msg.sender, address(this), amountIn);
        tokenOut.transfer(msg.sender, amountOut);
    }
}
