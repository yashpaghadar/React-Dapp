
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function decimals() external view returns (uint8);
}

contract Greeter {
    string private greeting;
    address public owner;
    IERC20 public token;

    event GreetingUpdated(string _greeting);

    constructor(string memory _greeting, address _token) {
        greeting = _greeting;
        owner = msg.sender;
        token = IERC20(_token);
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string memory _greeting) public {
        uint256 payment = 10 * 10 ** token.decimals();
        require(token.transferFrom(msg.sender, owner, payment), "Payment failed");
        greeting = _greeting;
        emit GreetingUpdated(_greeting);
    }
}


