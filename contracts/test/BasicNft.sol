// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.8;

/**
 *!Contrato Simple de Nft usando OppenZeppeling
 **/

//Imports

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BasicNft is ERC721 {
    event BasicNftMinted(uint256 indexed tokenId);
    //Creamos un s_tokenCounter que va a ser el ID de cada NFT que producimos. Este TokenID lo necesita la funcion
    // _safeMint como parámetro

    uint256 private s_tokenCounter; //Privada
    string public constant TOKEN_URI =
        "ipfs://bafybeiakjel7qutwaasmappgedbpeub2skwr3pot57cakk7sr5hrd7wqze/?filename=token_uri_basic.json";

    constructor() ERC721("Guindaso", "GUI") {
        s_tokenCounter = 0;
    }

    function _mintNFT() public returns (uint256) {
        _safeMint(msg.sender, s_tokenCounter);

        emit BasicNftMinted(s_tokenCounter);

        //Le añadimos +1 y hacemos return. para que cada vez que minteemos un NFT, se actualice el TokenID y sea único para cada NFT
        s_tokenCounter = s_tokenCounter + 1;
        return s_tokenCounter;
    }

    function tokenURI(
        uint256 /*_tokenId*/
    ) public pure override returns (string memory) {
        return TOKEN_URI;
    }

    //VIew, Pure Function

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
