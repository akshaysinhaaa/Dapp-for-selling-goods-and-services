// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MarketToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("MarketToken", "MKT") Ownable(0xF05184D3Cd03a6f768C694d9A5DDd15af4d449bB) {
        // Mint initial supply to your address
        _mint(0xF05184D3Cd03a6f768C694d9A5DDd15af4d449bB, initialSupply * 10 ** decimals());
    }

    // Only you (owner) can mint more tokens
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}