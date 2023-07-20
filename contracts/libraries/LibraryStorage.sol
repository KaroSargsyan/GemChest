// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "contracts/interface/AggregatorV3Interface.sol";
import "contracts/interface/IQuoter.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";


// Define the LibraryStorage library.
library LibraryStorage {

    // The LIB_STORAGE_POSITION constant represents the storage slot of the library.
    bytes32 constant LIB_STORAGE_POSITION = keccak256("diamond.standard.lib.storage");

    // The Status enum represents the possible status values for a Token or LockedAsset.
    enum Status {x, CLOSE, OPEN}

    // The Deposit event is emitted when a deposit is made.
    event Deposit( uint indexed num, address ETH, string str);
    
    // The Claim event is emitted when a claim is made.
    event Claim(string success);


    /**
     * @dev This struct represents a token, which includes its address, price feed address,
     * minimum amount to lock, collected fee balance, decimal, and status.
     */
    struct Token {
        address tokenAddress;
        uint minAmount;
        uint collectedFees;
        address priceFeedAddress;
        uint8 decimal;
        Status status;
    }


    struct depositParams {
        address[] _addr ;
        uint _amount;
        uint _otherFees; 
        uint _endDate;
        uint _target;
        bool[] _features;
        string _uuid;
        uint8 _skinId;
    }

    /** The LockedAsset struct represents a locked asset.
     * @dev This struct represents a locked asset, which includes the token being locked,
     * the beneficiary who will receive the asset after the lockup period, the creator of the lock, 
     * the amount being locked, the claimed amount, the end date of the lockup period, the fee rate 
     * (expressed as a percentage), the price of the asset in USD at the time of creation, 
     * the target rate (expressed as a percentage) the asset, an array of boolean is gift and 
     * is owned features, and the status of the lock.
     */
    struct LockedAsset {
        address token;
        address beneficiary;
        address creator;
        uint amount;
        uint claimedAmount;
        uint endDate;
        uint8 feeRate;
        int priceInUSD;
        uint target;
        bool[] features;
        Status status;
        uint skinId;
    }

    struct Skin {
        address owner;
        uint price;
    }

    struct TotalBalance {
        uint mainBalance;
        uint skinReward; 
    }
    

    // The LibStorage struct represents the storage for the LibraryStorage library.
    struct LibStorage {
        address UNISWAP_V3_ROUTER;
        address QUOTER_ADDRESS;
        address ETH;
        address WETH;
        address SIGNER;
        address GemChestAddress;
        uint8 startFee;
        uint8 endFee;
        uint8 affiliateRate;
        uint8 slippage;
        uint8 rewardRate;
        uint8 skinRate;
        uint24  swapFee;
        uint _lockId;
        Token Token;
        Status status;
        uint getAmountOutMinState;

        
        mapping(address => Token) _tokenVsIndex;
        mapping(uint256 => LockedAsset) _idVsLockedAsset;
        mapping(uint => Skin) _skinIdVsAddress;
        mapping (address => mapping (address => TotalBalance)) _balances;
        uint[][] fixedFees;
        address v2Contract;
        bool isActive;
        bool initialized;
    }

    // The libStorage function returns the storage for the LibraryStorage library.
    function libStorage() internal pure returns (LibStorage storage lib) {
        bytes32 position = LIB_STORAGE_POSITION;
        assembly {
            lib.slot := position
        }
    }

     function getToken(address _tokenAddress) internal view returns(Token memory)
    {
        // LibStorage storage lib = libStorage();
        return libStorage()._tokenVsIndex[_tokenAddress];
    }

    function getLockedAsset(uint256 assetId) internal view returns (LockedAsset memory) {
        LibStorage storage lib = libStorage();
        return lib._idVsLockedAsset[assetId];
    }

    /** 
     * @dev This function calculates a fee based on a given amount, a percentage, and a boolean to indicate whether to add or subtract the fee.
     */
    function _calculateFee(uint amount, bool plus, uint procent) internal pure returns(uint256 calculatedAmount) { 
        calculatedAmount = procent == 0 ? amount : (plus) ? amount + percentOf(amount,procent) : amount - percentOf(amount,procent);
    }

    /**
     * @dev This function calculates a fixed fee based on the current price of the token.
     */
    function _calculateFixedFee(address _token, uint amount, bool plus) internal view returns(uint256 calculatedAmount) { 
        LibStorage storage lib = libStorage();
        Token memory token = lib._tokenVsIndex[_token];        
        uint fixedAmount = (uint(getLatestPrice(token.priceFeedAddress)) * amount) / (10**token.decimal);        
        uint lenght = lib.fixedFees.length;
        uint fee = lib.fixedFees[lenght-1][1];
        for(uint i; i < lenght;) {
            if (fixedAmount <= lib.fixedFees[i][0]){
                fee = lib.fixedFees[i][1];
                break;
            }
            unchecked {
                i++;
            }
        }
        calculatedAmount = _calculateFee(amount, plus, fee);
    }

    /**
     *@dev Gets the latest price for a given price feed address.
     *@param _priceFeedAddress The address of the price feed.
     */
    function getLatestPrice(address _priceFeedAddress) internal view returns (int price) {   
        AggregatorV3Interface aggregatorV3Interface = AggregatorV3Interface(_priceFeedAddress);
        (,price,,,) = aggregatorV3Interface.latestRoundData();
    }

    /**
     * @dev Helper function to get the path of token pairs for later actions.
     * @param _tokenIn The address of the token to swap from.
     * @param _tokenOut The address of the token to swap to.
     * @return path of tokens.
     */
    function getPath(address _tokenIn, address _tokenOut) internal view returns(address[2] memory path){
        LibStorage storage lib = libStorage();
        path[0] = (_tokenIn != lib.ETH) ? _tokenIn: lib.WETH;
        path[1] = (_tokenOut != lib.ETH) ? _tokenOut: lib.WETH;
    }

    // The getMessageHash function takes a message string and returns its keccak256 hash.
    function getMessageHash(string memory _message) internal pure returns (bytes32){
        return keccak256(abi.encodePacked(_message));
    }

    // The getEthSignedMessageHash function takes a message hash and returns its hash as an Ethereum signed message.
    function getEthSignedMessageHash(bytes32 _messageHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }

    // The verify function takes a message, signature, and signer address and returns a boolean indicating whether the signature is valid for the given message and signer.
    function verify(string memory message, bytes memory signature, address signer) internal pure returns (bool) {
        bytes32 messageHash = getMessageHash(message);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        return recoverSigner(ethSignedMessageHash, signature) == signer;
    }

    // The recoverSigner function takes an Ethereum signed message hash and a signature and returns the address that signed the message.
    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) internal pure returns (address){
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    // The recoverSigner function takes an Ethereum signed message hash and a signature and returns the address that signed the message.
    function splitSignature(bytes memory sig) internal pure returns (bytes32 r,bytes32 s,uint8 v){
        require(sig.length == 65, "invalid signature length");
        assembly { 
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    /** 
     * @dev This function calculates the estimated minimum amount of `_tokenOut` tokens that can be received for a given `_amountIn` of `_tokenIn` tokens
     */
    function getAmountOutMin(address _tokenIn, address _tokenOut, uint256 _amountIn) internal returns(uint256 amountOut) {
        address[2] memory path = getPath(_tokenIn, _tokenOut);
        try IQuoter(libStorage().QUOTER_ADDRESS).quoteExactInputSingle(path[0],path[1], libStorage().swapFee ,_amountIn,0)
        returns (uint _amountOut) {
            amountOut = _amountOut;
        } catch {}
    }

    /**
     * @dev This helper function checks if a locked asset with the given `id` can be claimed
     */
    function claimable(uint256 id) internal view returns(bool success){
        LockedAsset memory asset = libStorage()._idVsLockedAsset[id];
        // Check if the claim period has ended or if the asset has already been claimed, and if the status of the asset is open
        return (asset.endDate <= block.timestamp || _eventIs(id)) &&  asset.status == Status.OPEN ;
    }

    /**
     * @dev This function Check if the given asset current price greater or equal to the target price  
     * @param id locked asset id
     */
    function _eventIs(uint id) internal view returns(bool success) {
        LockedAsset memory asset = libStorage()._idVsLockedAsset[id];
        if (asset.status == Status.CLOSE || asset.status == Status.x){
            return false;
        }
        else {
            address _priceFeedAddress = getToken(asset.token).priceFeedAddress;
            // Get the latest price of the token from the price feed using the oracle contract
            int oraclePrice = getLatestPrice(_priceFeedAddress);
            // Check if the current price of the token is greater than or equal to the target price of the asset amount
            return oraclePrice * 5 >= percentOfInt(asset.priceInUSD, int(asset.target));
        } 
    }

    /**
     * 
     * @dev Internal function to transfer funds from the contract to a given receiver.
     * @param _token The address of the token to transfer.
     * @param _receiver The address to receive the funds.
     * @param _value The amount of funds to transfer.
     */
    function transferFromContract (address _token, address _receiver, uint _value) internal {
        bool sent;
        if (_token == libStorage().ETH) {
            (sent,) = payable(_receiver).call{value: _value}("");
        } else {
            (sent) = IERC20(_token).transfer(_receiver, _value);
        }
        require(sent, "tx failed");
    }


    function getAmountOraclePrice (address _token, address _swapToken, uint newAmount) internal view returns(uint amountOraclePrice) {
        LibStorage storage lib = libStorage();
        Token memory token = lib._tokenVsIndex[_token];
        uint lastPrice = uint(getLatestPrice(token.priceFeedAddress));
        uint8 oraclePriceLength = uint8(bytes(Strings.toString(lastPrice)).length);
        oraclePriceLength = (oraclePriceLength > 7 ) ? 8 : (17 - oraclePriceLength);
        amountOraclePrice = (lastPrice * newAmount * 10** lib._tokenVsIndex[_swapToken].decimal) / 10** (token.decimal + oraclePriceLength);
        amountOraclePrice -= percentOf(amountOraclePrice,lib.slippage); 
        // console.log(amountOraclePrice,"amountOraclePriceamountOraclePriceamountOraclePrice");
    }


    function percentOf(uint256 amount, uint256 rate) internal pure returns (uint256) {
        uint256 result;
        assembly {
            let mulR := mul(amount, rate)
            result := div(mulR, 100)
        }
        return result;
    }

    function percentOfInt(int256 amount, int256 rate) internal pure returns (int256) {
        int256 result;
        assembly {
            let mulR := mul(amount, rate)
            result := div(mulR, 100)
        }
        return result;
    }

}


/** 
                                                         \                           /      
                                                          \                         /      
                                                           \                       /       
                                                            ]                     [    ,'| 
                                                            ]                     [   /  | 
                                                            ]___               ___[ ,'   | 
                                                            ]  ]\             /[  [ |:   | 
                                                            ]  ] \           / [  [ |:   | 
                                                            ]  ]  ]         [  [  [ |:   | 
                                                            ]  ]  ]__     __[  [  [ |:   | 
                                                            ]  ]  ] ]\ _ /[ [  [  [ |:   | 
                                                            ]  ]  ] ] (#) [ [  [  [ :====' 
                                                            ]  ]  ]_].nHn.[_[  [  [        
                                                            ]  ]  ]  HHHHH. [  [  [        
                                                            ]  ] /   `HH("N  \ [  [        
                                                            ]__]/     HHH  "  \[__[        
                                                            ]         NNN         [        
                                                            ]         N "         [          
                                                            ]         N H         [        
                                                           /          N            \        
                                                          /     how far you can     \       
                                                         /        go Mr.Green ?      \          
                                                    
*/