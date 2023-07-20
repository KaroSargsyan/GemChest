// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {LibraryStorage as ls} from "../libraries/LibraryStorage.sol";
import {LibDiamond as ds} from "../libraries/LibDiamond.sol";
// import "../IFaucet1.sol";
import  "../interface/IV2Contract.sol";
import "../IGemChest.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";


contract Faucet2 {
    
    IGemChest public gemChest;
    IV2Contract public iv2Contract;

    event Deposit(string uuid, uint tokenId, uint _amountforDeposit,int price, string str);
    event Log(bool message);

    /** @dev Modifier to ensure that the caller has a specific role before executing a function.
     * The `role` parameter is a bytes32 hash that represents the role that the caller must have.   
     */
    modifier onlyRole(bytes32 role) {
        ds._checkRole(role);
        _;
    }

    /**
     * @dev Modifier to ensure that the contract is active
     */
    modifier isActive {
        require(ls.libStorage().isActive == true, "not_Active");
        _;
    }

    /**
     * @dev Returns information about a token.
     * @param _tokenAddress The address of the token to get information for.
     * @return The token's address, minimum amount, balance ,pricefeed address, number of decimals, and status.
     */
    function getToken(address _tokenAddress) external view returns(ls.Token memory){        
        return ls.getToken(_tokenAddress);
    }   

    /**
     * @dev Returns information about a locked asset.
     * @param assetid The ID of the locked asset to get information for.
     * @return The asset's locked tolen address, owner, beneficiary, creator, amount, fee rate, end date, claimed token amount ,lock price nn USD, target rate, features and status.
     */
    function getLockedAsset(uint256 assetid) external view returns (ls.LockedAsset memory){
        return ls.getLockedAsset(assetid);    
    }

    function getSkin(uint id) public view returns(address,uint){
        ls.LibStorage storage lib = ls.libStorage();
        return (lib._skinIdVsAddress[id].owner, lib._skinIdVsAddress[id].price) ;
    }
     
    /** 
     * @dev Adds a new token to the contract with the specified parameters.
     * Only the ADMIN role can call this function.
     * The token's status is set to OPEN by default.
     *
     * @param _address Address of the token contract to be added
     * @param _minAmount The minimum amount of the token that can be deposited
     * @param _priceFeedAddress Price feed address of token pair
     * @param _decimal The number of decimal places used by the token. 
     */
    function addToken(address _address, uint256 _minAmount, address _priceFeedAddress, uint8 _decimal) external onlyRole(ds.ADMIN) {
        ls.LibStorage storage lib = ls.libStorage();
        lib._tokenVsIndex[_address] = ls.Token({tokenAddress : _address, minAmount : _minAmount,
        priceFeedAddress : _priceFeedAddress, collectedFees : 0, decimal : _decimal, status : ls.Status.OPEN});
    }

    function addTokenn(address[] memory _address, address[] memory _priceFeedAddress , uint256[] memory _minAmount, uint8[] memory _decimal) external onlyRole(ds.ADMIN) {
        ls.LibStorage storage lib = ls.libStorage();
        uint length= _address.length;
        for(uint i=0; i < length;){
            lib._tokenVsIndex[_address[i]] = ls.Token({tokenAddress : _address[i], minAmount : _minAmount[i],
            priceFeedAddress : _priceFeedAddress[i], collectedFees : 0, decimal : _decimal[i], status : ls.Status.OPEN});
            unchecked {
                i++;
            }
        }

    }

    /** @dev Adds a new token to the contract with the specified parameters.
     * Only the ADMIN role can call this function.
     * The token's status is set to OPEN by default.
     *
     * @param _token The address of the token contract to be added.
     * @param _priceFeedAddress Price feed address of token pair.
     * @param _minAmount The minimum amount of the token that can be deposited.
     * @param _isActive the boolean for token status
     * @param _decimal The number of decimal places used by the token.
     */
    function setToken(address _token, address _priceFeedAddress, uint _minAmount, bool _isActive, uint8 _decimal) external onlyRole(ds.ADMIN) {  
        ls.LibStorage storage lib = ls.libStorage();  
        ls.Token storage token = lib._tokenVsIndex[_token];
        token.priceFeedAddress = _priceFeedAddress;
        token.minAmount = _minAmount;
        token.decimal = _decimal; 
        token.status = _isActive  ? ls.Status.OPEN : ls.Status.CLOSE;
    }

    /**
     * @dev Sets the fee parameters for the contract.
     * Only the ADMIN role can call this function.
     * 
     * @param _startFee The starting fee for the contract.
     * @param _endFee The ending fee for the contract.
     * @param _affiliateRate The affiliate rate for the contract.
     * @param _arr array representing the fixed fees for the contract.
     */
    function setFee(uint8 _startFee, uint8 _endFee, uint8 _affiliateRate, uint8 _slippage, uint8 _rewardRate, uint[][] memory _arr,uint24 _swapFee, uint8 _skinRate) external onlyRole(ds.ADMIN) {
        ls.LibStorage storage lib = ls.libStorage();  
        lib.startFee = _startFee;
        lib.endFee = _endFee;
        lib.slippage = _slippage;
        lib.affiliateRate = _affiliateRate;
        lib.fixedFees = _arr;
        lib.rewardRate = _rewardRate;
        lib.swapFee = _swapFee;
        lib.skinRate = _skinRate;
    }
    
    /**
     * @dev This function swaps the balance of collected fees and transfer, but only if the caller has the ADMIN role.
     * @param _tokenIn The address of the token to swap from.
     */
    // */address _tokenOut*/
    //  * @param _tokenOut The address of the token to swap to.
    function swapTokenBalance(address _tokenIn) public onlyRole(ds.ADMIN) {
        ls.LibStorage storage lib = ls.libStorage();  
        ls.Token storage token = lib._tokenVsIndex[_tokenIn];
        uint swapingAmount = token.collectedFees;
        token.collectedFees = 0;
        ls.transferFromContract(_tokenIn, msg.sender, swapingAmount);
   
    }

    /**
     * @dev This function checks if an array of assets can be claimed.
     * @param _arr The array of asset IDs to check.
     * @return ids An array of asset IDs, checked A boolean array representing whether each asset is claimable or not.
     */
    function checkClaim(uint[] calldata _arr) public view returns(uint[] memory ids, bool[] memory checked){
        uint lenght=_arr.length;
        ids = new uint[](lenght);
        checked = new bool[](lenght);
        for(uint i=0; i < lenght;){
            ids[i] = _arr[i];
            checked[i] = ls.claimable(_arr[i]);
            unchecked {
                i++;
            }
        }
    }

    /**
     * @dev Migrates an asset to V2.
     * Only assets with an `OPEN` status, is not gift and is owned features can be migrated.
     * Only the beneficiary can call this function.
     * 
     * @param assetId The ID of the asset to be migrated.
     * 
     * The function sets the status of the asset to `CLOSE`, calls the `Migrate` function of the V2 contract to create a new asset,
     * burns the old asset, and transfers the asset amount to the V2 contract. If the asset token is ETH, the transfer is made via a call
     * with the ETH value in the transaction. Otherwise, the transfer is made using the `transfer` function of the token.
     */
    function migrateAsset(uint assetId) public isActive {
        ls.LibStorage storage lib = ls.libStorage();
        ls.LockedAsset storage asset = lib._idVsLockedAsset[assetId];        
        require(asset.status == ls.Status.OPEN);
        require(asset.features[0]);
        require(!asset.features[1]);
        require(msg.sender == asset.beneficiary);
        asset.status = ls.Status.CLOSE;
        uint mainBalance = lib._balances[asset.beneficiary][asset.token].mainBalance;         
        mainBalance = mainBalance - asset.amount;
        iv2Contract.Migrate(
        asset.token, asset.beneficiary, asset.creator, asset.amount, asset.endDate,
        asset.feeRate, asset.priceInUSD, asset.target, asset.features);
        gemChest.burn(assetId);
        ls.transferFromContract(asset.token,lib.v2Contract,asset.amount);
    }

    // @notice this functions just used for tests. 
    function executeGetAmountOutMin(address _tokenIn, address _tokenOut, uint256 _amountIn) public {
        ls.libStorage().getAmountOutMinState = ls.getAmountOutMin(_tokenIn,_tokenOut, _amountIn);
    }   

    function getAmountOutMin() public view returns(uint){
        return ls.libStorage().getAmountOutMinState;
    }

    // function changeSkinPrice(uint _price) public {
    //     ls.LibStorage storage lib = ls.libStorage();
    //     ls.Skin storage skin = lib._skinIdVsAddress[_price]; 
    //     require(msg.sender == skin.owner);
    //     skin.price = _price;
    // }

    function getBalanceOf(address _addr, address _token) public view returns (uint,uint){
        ls.LibStorage storage lib = ls.libStorage();
        return (lib._balances[_addr][_token].mainBalance, lib._balances[_addr][_token].skinReward);
    }

    function withdrawSkinReward(address _token) public {
        ls.LibStorage storage lib = ls.libStorage();
        require(lib._balances[msg.sender][_token].skinReward > 0,"insufficient amount");
        uint amount = lib._balances[msg.sender][_token].skinReward;
        lib._balances[msg.sender][_token].skinReward = 0;
        ls.transferFromContract(_token, msg.sender, amount);
    }

    /**
     * @dev Sets the v2Contract address and activates it in the LibStorage library.
     * Access is restricted to users with the `ADMIN` role.
     * 
     * @param _v2Contract The address of the v2Contract to set.
     */
    function activateV2Contract(address _v2Contract) external onlyRole(ds.ADMIN) {
            ls.LibStorage storage lib = ls.libStorage();
            iv2Contract = IV2Contract(_v2Contract); 
            lib.v2Contract = _v2Contract;
            lib.isActive = true;   
    }

        /**
     * @dev submitBeneficiary function allows the user to submit a new beneficiary for the asset.
     * @param _id The ID of the locked asset.
     * @param _message The message to be signed by the user.
     * @param _signature The signature of the user.
     * @param _swapToken The address of the stablecoin used to get asset claimed amount.
     * @param _newBeneficiary The address of the beneficiary of the locked asset.
     * @notice In place of SIGNER address will be hardcoded signer address
     */
    function submitBeneficiary(uint _id, string memory _message, bytes memory _signature, address _swapToken, address _newBeneficiary) public {
        ls.LibStorage storage lib = ls.libStorage();
        ls.LockedAsset storage asset = lib._idVsLockedAsset[_id];
        ls.Token storage token = lib._tokenVsIndex[_swapToken];
        require(!asset.features[0], "asset isOwned");
        require(token.status == ls.Status.OPEN);
        asset.features[0] = true;
        if (!ds.hasRole(ds.ADMIN, msg.sender)){
                _message = string (abi.encodePacked(_message, Strings.toString(_id)));
                require (ls.verify(_message, _signature, lib.SIGNER), "false signature");
        }
        if (asset.status == ls.Status.OPEN) { 
            lib._balances[asset.beneficiary][asset.token].mainBalance -= asset.amount;
            asset.beneficiary = _newBeneficiary;
            gemChest.safeTransferFrom(address(this), _newBeneficiary, _id);
            lib._balances[_newBeneficiary][asset.token].mainBalance += asset.amount;
        } else {
            uint _newAmount= asset.claimedAmount;
            require(_newAmount > 0);
            asset.claimedAmount = 0;
            _swapToken = (asset.features[2]) ? _swapToken : asset.token;
            ls.transferFromContract(_swapToken,_newBeneficiary,_newAmount);
        }
    }
    
}   
