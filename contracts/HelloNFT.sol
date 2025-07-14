// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HelloNFT
 * @dev Basic ERC721 NFT contract that allows the owner to mint NFTs with metadata and is enumerable.
 */
contract HelloNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    uint256 public tokenCounter;

    constructor() ERC721("HelloNFT", "HNFT") {
        tokenCounter = 0;
    }

    /*
     * @dev Mints a new NFT to the specified address with a token URI (metadata).
     * @param to The address to mint the NFT to.
     * @param tokenURI The metadata URI for the NFT.
     * @return The token ID of the newly minted NFT.
     */
        function mintNFT(address to, string memory _tokenURI) public returns (uint256) {
        uint256 newTokenId = tokenCounter;
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        tokenCounter += 1;
        return newTokenId;
    }

    // The following functions are overrides required by Solidity for multiple inheritance.
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
