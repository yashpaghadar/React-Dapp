// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Greeter {
    string private greeting;
    address public owner;

    constructor(string memory _greeting) {
        greeting = _greeting;
        owner = msg.sender;
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string memory _greeting) public {
        require(msg.sender == owner, "Only owner can update greeting");
        greeting = _greeting;
    }
}
