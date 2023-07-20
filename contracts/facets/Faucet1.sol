// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../IGemChest.sol";

import {LibraryStorage as ls} from "../libraries/LibraryStorage.sol";
import { LibDiamond as ds } from "../libraries/LibDiamond.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interface/ISwapRouter.sol";
import "hardhat/console.sol";

contract Faucet1 { 

    IGemChest gemChest;

    event Deposit(string uuid, uint tokenId, uint _amountforDeposit, int price, address _addr, string str);
    event Claim(string success);
    event BulkClaim(uint[]);
    event BulkFalse(uint);
    
    error errClaim(uint _id, string _str);
    
    /** 
     * @dev Modifier to ensure that the caller has a specific role before executing a function.
     * The `role` parameter is a bytes32 hash that represents the role that the caller must have.   
     */
    modifier onlyRole(bytes32 role) {
        ds._checkRole(role);
        _;
    }

    receive() external payable {}

    /**
     * @dev Initializes the LibStorage library with default values.
     * Access is restricted to users with the `ADMIN` role.
     * 
     * @param nftAddress The address of the GemChest nft contract.
     * @param weth The address of the Wrapped Ethereum.      
     */
    function initialize (address nftAddress, address signer, address quoter, address swapRouter, address weth) onlyRole(ds.ADMIN) external {   
        ls.LibStorage storage lib = ls.libStorage();
        require(!lib.initialized, "already_init");
        lib.initialized = true;        
        gemChest = IGemChest(nftAddress); 
        lib.GemChestAddress = nftAddress;
        lib.ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
        lib.SIGNER = signer;
        lib.QUOTER_ADDRESS = quoter;
        lib.UNISWAP_V3_ROUTER = swapRouter; 
        lib.WETH = weth;
        lib._lockId = 1;
    }

    // /**
    //  * @dev Allows users to deposit tokens into the contract, locking them for a specific period of time and 
    //  * on the expected percentage of growth:
    //  * @param _addr An array containing the token address, the beneficiary address, and an optional affiliate address.
    //  * @param _amount The amount of tokens to deposit.
    //  * @param _otherFees Additional fees associated with the deposit.
    //  * @param _endDate The date until which the tokens will be locked.
    //  * @param _target The target price for the token.
    //  * @param _features An array of boolean values indicating the features of the locked tokens [isOwned] [isGift] [isExchangable].
    //  * @param _uuid A unique identifier for the deposit.
    //  */  
    function deposit(
        ls.depositParams calldata params
    ) 
        public payable
    {
        ls.LibStorage storage lib = ls.libStorage();
        ls.Token storage token = lib._tokenVsIndex[params._addr[0]];
        require(token.status == ls.Status.OPEN, "invalid _token");
        require(params._endDate > block.timestamp, "invalid _endDate");
        require(params._amount >= token.minAmount, "incorect _amount");
        require(params._skinId != 0);                                                                                            
        
        uint newAmount = ls._calculateFixedFee(params._addr[0], params._amount, true);
        uint totalAmount = newAmount + params._otherFees;
        require(lib.ETH == params._addr[0] ?
        msg.value >= totalAmount : IERC20(params._addr[0]).transferFrom(msg.sender, address(this), totalAmount), "invalid_tx");

        uint tokenId = lib._lockId++;
        int priceInUSD = ls.getLatestPrice(token.priceFeedAddress);
        lib._idVsLockedAsset[tokenId] = ls.LockedAsset({ token : params._addr[0], beneficiary : params._addr[1],
        creator : msg.sender, amount : params._amount, feeRate : lib.endFee, endDate : params._endDate, target :params._target, 
        claimedAmount : 0, priceInUSD : priceInUSD, features : params._features, status : ls.Status.OPEN ,
        skinId:params._skinId});

        lib._balances[params._addr[1]][params._addr[0]].mainBalance += params._amount;                                                                                           ////////////////////
        uint skinFee = 0 ; uint affiliateFee = 0;
        if (lib._skinIdVsAddress[params._skinId].owner == address(0)) {                                                    
            lib._skinIdVsAddress[params._skinId].owner = msg.sender;
        } else {
            skinFee = ls.percentOf(params._otherFees,lib.skinRate);
            lib._balances[lib._skinIdVsAddress[params._skinId].owner][params._addr[0]].skinReward += skinFee;
        }
        (params._features[0]) ? gemChest.safeMint(params._addr[1], tokenId) : gemChest.safeMint(address(this),tokenId) ;
        if (params._addr[2] != address(0)){
            affiliateFee = ls.percentOf((newAmount - params._amount), lib.affiliateRate);
            ls.transferFromContract(params._addr[0], params._addr[2], affiliateFee);
        }
        token.collectedFees += (totalAmount - params._amount - affiliateFee - skinFee);
        emit Deposit(params._uuid, tokenId, params._amount, priceInUSD, msg.sender, "Success");
    }

    /**
     * @dev Claims rewards for multiple NFTs in bulk.
     * Access is restricted to users with the `ADMIN` role.
     *
     * @param _ids An array of NFT IDs to claim rewards for.
     * @param _swapToken The address of the token to use for swapping to the desired reward.
     * @return A boolean indicating whether the claim was successful.
     */
    function bulkClaim(uint[] calldata _ids, address _swapToken) external onlyRole(ds.ADMIN) returns(bool) {
        ls.LibStorage storage lib = ls.libStorage();
        require(lib._tokenVsIndex[_swapToken].status == ls.Status.OPEN);
        uint length = _ids.length;
        for(uint i=0; i < length;){
            if (!ls.claimable(_ids[i])) {
                emit BulkFalse(_ids[i]);
                revert errClaim(_ids[i], "bulkClaim_err");
            } 
            claim(_ids[i],_swapToken);
            unchecked {
                i++;
            }
        }
        emit BulkClaim(_ids);
        return true;
    }
    /**
     * @dev Claim function allows the owner of the asset to claim it after its vesting period ends 
     * or price of locked asset equal or grather then asset target rate.
     *
     * @param _id The ID of the locked asset.
     * @param _swapToken The address of the token to be used for swapping. 
     */
    function claim(uint256 _id, address _swapToken) public {
        ls.LibStorage storage lib = ls.libStorage();
        ls.LockedAsset storage asset = lib._idVsLockedAsset[_id];
        ls.Token storage token = lib._tokenVsIndex[asset.token];
        require(ds.hasRole(ds.ADMIN, msg.sender) || msg.sender == asset.beneficiary, "only owner");
        require(lib._tokenVsIndex[_swapToken].status == ls.Status.OPEN);
        bool eventIs = ls._eventIs(_id);
        require((asset.endDate <= block.timestamp || eventIs ) &&  asset.status == ls.Status.OPEN, "can't claim");
        asset.status = ls.Status.CLOSE;
        uint newAmount = ls._calculateFee(asset.amount, false, asset.feeRate);
        token.collectedFees += (asset.amount - newAmount);
        (bool feature0, bool feature1, bool feature2) = (asset.features[0], asset.features[1] ,asset.features[2]);
        address receiver = (feature0) ? asset.beneficiary : address(this);
        lib._balances[asset.beneficiary][asset.token].mainBalance -= asset.amount;         
        uint giftreward;
        if (feature1 && eventIs && asset.creator != asset.beneficiary){
            giftreward = ls.percentOf(newAmount,lib.rewardRate);            
            newAmount -= giftreward;
            if(!feature2){
                ls.transferFromContract(asset.token, asset.creator, giftreward);
            }
        }
        uint swappedAmount; bool swapped;
        if (feature2 && asset.token != _swapToken) {
            uint amountOutMinimum = ls.getAmountOutMin(asset.token, _swapToken, newAmount) ;
            if (amountOutMinimum >= ls.getAmountOraclePrice(asset.token,_swapToken,newAmount)){
                (swapped, swappedAmount) = swap(asset.token, _swapToken, newAmount,receiver);                
                require(swapped);
                if(giftreward > 0 ){
                    (swapped,) = swap(asset.token, _swapToken, giftreward, asset.creator);
                    require(swapped);
                }
            } 
        } 
        if (feature0 && !swapped){
            ls.transferFromContract(asset.token, receiver, newAmount);
        }
        asset.claimedAmount = (feature0) ? 0 : ((swapped) ? swappedAmount : newAmount);
        gemChest.burn(_id);
        emit Claim("claim_isDone");     
    }

    /**
     * @dev swap function allows swapping of tokens using UniswapV3.
     * @param _tokenIn The input token address.
     * @param _tokenOut The output token address.
     * @param _amountIn The amount to be swapped.
     * @param _to The address to receive the swapped tokens.
     */

    function swap (address _tokenIn, address _tokenOut, uint _amountIn,address _to) internal returns (bool,uint){
        ls.LibStorage storage lib = ls.libStorage();
        address[2] memory path = ls.getPath(_tokenIn,_tokenOut);        
        address router = lib.UNISWAP_V3_ROUTER;
        bool isNotETH =  (_tokenIn != lib.ETH);
        (isNotETH) ? require(IERC20(_tokenIn).approve(router, _amountIn)) : ();
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: (isNotETH) ?  path[0] : lib.WETH,
            tokenOut: path[1],
            fee: lib.swapFee,
            recipient: _to,
            deadline: block.timestamp,
            amountIn: _amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });
        uint amountOut =  (isNotETH) ? ISwapRouter(router).exactInputSingle(params) : ISwapRouter(router).exactInputSingle{value:_amountIn}(params);
        return (true, amountOut) ;
    }

    /**
     * @dev transferBeneficiary function allows the owner of the asset to transfer the beneficiary address to a new address.
     * @param _newBeneficiary The new address of the beneficiary.
     * @param _assetId The ID of the locked asset.
     */
    function transferBeneficiary(address _newBeneficiary, uint _assetId) public {
        ls.LibStorage storage lib = ls.libStorage();
        ls.LockedAsset storage asset = lib._idVsLockedAsset[_assetId];
        address beneficiary = asset.beneficiary;
        require (msg.sender == beneficiary || msg.sender == lib.GemChestAddress, "incorrect owner");
        lib._balances[beneficiary][asset.token].mainBalance -= asset.amount;
        (msg.sender == beneficiary) ? gemChest.transferFrom(msg.sender, _newBeneficiary, _assetId) : () ;
        asset.beneficiary = _newBeneficiary;
        lib._balances[_newBeneficiary][asset.token].mainBalance += asset.amount;          
    }

}

