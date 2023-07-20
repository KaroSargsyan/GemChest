// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IFaucet1.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// import "hardhat/console.sol";


contract GemChest is ERC721, Ownable {
    
    string constant private EXT = ".json";
    string private _baseUri = "https://portal.gemchest.io/metadata/polygon/";
    
    address immutable faucet1Address;

    constructor(address _faucetAddress) ERC721("GemChest", "GEM") {
        faucet1Address = _faucetAddress;
    }

    /**
     * @dev Modifier that restricts the function to be called only by the Diamond Faucet contract.
     */
    modifier onlyDiamondFaucet() {
        require (_msgSender() == faucet1Address, "Only Faucet1");
        _;
    }
    
    /**
     * @dev Returns the base URI used for tokenURI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseUri;
    }

    /**
     * @dev Returns the URI for a specific token ID
     * @param _tokenId The ID of the token to retrieve the URI for
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        _requireMinted(_tokenId);
        string memory baseURI = _baseURI();
        string memory tokenIdStr = Strings.toString(_tokenId);
        return string(abi.encodePacked(baseURI, tokenIdStr, "/", tokenIdStr, EXT) );
    }

    /**
     * @dev Mints a new token and assigns it to the specified address
     * Can call only Diamond Faucet contract
     *
     * @param _to The address to mint the token to
     * @param _tokenId The ID of the token to be minted
     */
    function safeMint(address _to, uint256 _tokenId) external onlyDiamondFaucet {
        _mint(_to,_tokenId);
    }

    /**
     * @dev Burns a specific token
     * Can call only Diamond Faucet contract
     *
     * @param _tokenId The ID of the token to be burned
     */
    function burn(uint256 _tokenId) external onlyDiamondFaucet {
        _burn(_tokenId);
    }

    /**
     * @dev Transfers the ownership of a given token ID to another address
     * @param from The current owner of the token
     * @param to The address to transfer the token ownership to
     * @param tokenId The ID of the token to be transferred
     */
    function transferFrom(address from, address to, uint256 tokenId) public override {
        require (_msgSender() == faucet1Address || ownerOf(tokenId) == _msgSender(), "only faucet1");
        require(_isApprovedOrOwner(_msgSender(), tokenId) || _msgSender() == faucet1Address, "caller isn't owner or approved");
        _transfer(from, to, tokenId);
        if (_msgSender() != faucet1Address) {
            IFaucet1(faucet1Address).transferBeneficiary(to,tokenId);
        }
    }

    /**
     * @dev Transfers the ownership of a given token ID from one address to another address
     * @param from The current owner of the token
     * @param to The address to transfer the token ownership to
     * @param tokenId The ID of the token to be transferred
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "caller isn't owner or approved");
        _safeTransfer(from, to, tokenId, data);
        (_msgSender() == faucet1Address) ? () : IFaucet1(faucet1Address).transferBeneficiary(to, tokenId);
    }

}