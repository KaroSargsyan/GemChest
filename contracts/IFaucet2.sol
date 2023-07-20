// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IFaucet2 { 

    function getLockedAsset(uint256 assetid) external view returns (address, address, address ,uint256, uint256, uint256,uint256,int,uint, bool[] memory, uint8);
    
    function getToken(address _tokenAddress) external view returns(address, uint256, uint, address , uint, uint8);

    function addToken(address tokenAddress, uint256 minAmount, address priceFeedAddress,uint decimal) external ;

    function setToken(address _token, address _priceFeedAddress, uint _minAmount, bool _isActive, uint _decimal) external;

    function setFee(uint _startFee,uint _endFee,uint _affiliateRate,uint[][] memory _arr) external;

}   