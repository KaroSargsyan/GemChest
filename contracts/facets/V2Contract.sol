// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {LibraryStorage as ls} from "../libraries/LibraryStorage.sol";

// import "hardhat/console.sol";

contract V2Contract{

    receive() external payable {}

    address private faucet1Address;

    constructor(address payable _faucetAddress) {
        faucet1Address = _faucetAddress;
    }

    modifier onlyDiamondFaucet() {
        require (msg.sender == faucet1Address, "Only Faucet1");
        _;
    }

    function Migrate(address token, address payable beneficiary ,address payable creator,uint amount,uint endDate,uint8 feeRate, int priceInUSD, uint target,bool[] memory features,
    uint8 skinId) external payable onlyDiamondFaucet {
        ls.LibStorage storage lib = ls.libStorage();
        lib._idVsLockedAsset[lib._lockId] = ls.LockedAsset({ token: token, 
        beneficiary: beneficiary, creator:creator, amount: amount, feeRate: feeRate, endDate : endDate, target:target ,claimedAmount: 0, 
        priceInUSD:priceInUSD,features:features, status:ls.Status.OPEN,skinId:skinId });
    }

    function getLockedAsset(uint256 assetid) external view returns (ls.LockedAsset memory){
        return ls.getLockedAsset(assetid);    
    }

}
