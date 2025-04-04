// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DecentralizedMarketplace {
    address public owner;
    IERC20 public token;

    struct Product {
        uint id;
        string name;
        uint price;
        address seller;
        bool sold;
    }

    mapping(uint => Product) public products;
    uint public productCount;

    event ProductListed(uint id, string name, uint price, address seller);
    event ProductPurchased(uint id, address buyer);

    constructor(address _tokenAddress) {
        owner = msg.sender;
        token = IERC20(_tokenAddress);
    }

    function listProduct(string memory _name, uint _price) public {
        require(_price > 0, "Price must be greater than zero");
        productCount++;
        products[productCount] = Product(productCount, _name, _price, msg.sender, false);
        emit ProductListed(productCount, _name, _price, msg.sender);
    }

    function buyProduct(uint _id) public {
        Product storage product = products[_id];
        require(product.id > 0 && !product.sold, "Product not available");
        require(token.transferFrom(msg.sender, product.seller, product.price), "Payment failed");
        product.sold = true;
        emit ProductPurchased(_id, msg.sender);
    }

    function getProducts() public view returns (Product[] memory) {
        Product[] memory allProducts = new Product[](productCount);
        for (uint i = 1; i <= productCount; i++) {
            allProducts[i-1] = products[i];
        }
        return allProducts;
    }
} 