/* global ethers */
/* eslint prefer-const: "off" */

const { ethers, utils } = require('hardhat')
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js');
const { keccak256 } = require('ethers/lib/utils.js');

async function deployDiamond () {
  
  let path = "IERC20"

  const accounts = await ethers.getSigners();
  const LINK = '0x326C977E6efc84E512bB9C30f76E30c160eD06FB';
  const USDT = '0x5faf0Ae8666b6d16870DfA877173b2B87b0851cA';
  const USDC = '0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e'
  const WBTC = '0x1671ffd1610386c5D6ea5a143043344758D52d9c';
  const WETH = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"; //from sushi
  const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const DAI = "0xcB1e72786A6eb3b44C2a2429e317c8a2462CFeb1";

  const WMATIC = "0x5B67676a984807a212b1c59eBFc9B3568a474F0a"

  const link = await ethers.getContractAt(path, LINK);  //or contracts/IERC20.sol:IERC20
  const usdc = await ethers.getContractAt(path, USDC);  //or contracts/IERC20.sol:IERC20
  const weth = await ethers.getContractAt(path, WETH);  //or contracts/IERC20.sol:IERC20

  const pricefeed_link = "0x1C2252aeeD50e0c9B64bDfF2735Ee3C932F5C408";
  const pricefeed_usdt = "0x92C09849638959196E976289418e5973CC96d645";
  const pricefeed_wbtc = '0x007A22900a3B98143368Bd5906f8E17e9867581b';
  const pricefeed_usdc = '0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0';
  const pricefeed_eth = '0x0715A7794a1dc8e42615F059dD6e406A6594651A';
  const pricefeed_matic = "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada";
  const pricefeed_dai = "0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046";

  const contractOwner1 = accounts[0];
  const contractOwner2 = accounts[1];


  const diamond_address = "0xd04FDb47Ba15B85dfdC8657BEFBc5738EB4d880B"     ///// add after deploy change
  
  const Diamond = await hre.ethers.getContractAt("Diamond", diamond_address);
  const faucet1 = await hre.ethers.getContractAt("Faucet1", diamond_address);
  const faucet2 = await hre.ethers.getContractAt("Faucet2", diamond_address);
  // diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamond.address);

  const diamondCutFacet = await hre.ethers.getContractAt("DiamondCutFacet", diamond_address);

  // const OwnershipFacet = await hre.ethers.getContractAt("OwnershipFacet", diamond_address);
  // const gemChest = await hre.ethers.getContractAt("GemChest", '0x673e9021FCE1c67F973A52e9907e953fFC08F8E2');


  const selectors = getSelectors(diamondCutFacet);

  // console.log(selectors)
  tx = await diamondCutFacet.diamondCut(
    [{
      facetAddress: ethers.constants.AddressZero,
      action: FacetCutAction.Remove,
      functionSelectors: selectors
    }],
    ethers.constants.AddressZero, '0x', { gasLimit: 100000 });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }
  // result = await DiamondLoupeFacet.facetFunctionSelectors('0x604B179ce5607ed63def24D54f3Bce01d6FaC1B6');
  // res = getSelectors(DiamondLoupeFacet);
  // console.log("RES After ********************************************************", res);
  
  // // console.log(await gemChest.tokenURI(101))
  // Tx = await faucet1.swap(ETH,"0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa",1300000000000000000n,"0x0ab61e7c46c6c682c8fc72e110edf69699daa8d2");

  //Change every time >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  // txAdd1 = await faucet2.addToken(ETH, 1, pricefeed_matic, 18)
  // txAdd2 = await faucet2.addToken(LINK,1,pricefeed_link, 18)
  // txAdd3 = await faucet2.addToken(USDC,1,pricefeed_usdc, 6)
  // txAdd4 = await faucet2.addToken(USDT,1,pricefeed_usdc, 18)
  // txAdd5= await faucet2.addToken(WETH,1,pricefeed_eth, 18)


  // let txSettFixedFees = await faucet2.setFee(0, 1, 1, 5, 1,[[100000000,1],[5000000000, 2], [100000000000, 3]]) 

  // await link.approve(faucet1.address, 1000000000000000000n);
  // await usdc.approve(faucet1.address, 10000000000);
  // await weth.approve(faucet1.address, 10000000000);

  // const depositParams = {
  //   _addr: [LINK, contractOwner1.address, contractOwner1.address],
  //   _amount:100000000000000000n,
  //   _otherFees: 0,
  //   _endDate: 1743743187,
  //   _target: 200,
  //   _features:[true, false, true],
  //   _uuid: "AAA-UUID"
  // }
  
  // let txDeposit1 = await faucet1.deposit(depositParams);


  // options={
  //   value: 100000000000000n 
  // }

  // getAmountOutMin = await faucet2.executeGetAmountOutMin(LINK, "0x0000000000000000000000000000000000001010", 1000000000000000000n)
  // xxx = await faucet2.getAmountOutMin()
  // TxClaim = await faucet1.claim(2, USDC);

// x = await faucet2.checkClaim([2,3,4,5,6,7])
// console.log(x)

// TxClaim = await faucet1.claim(8, "0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e");
// console.log(contractOwner1.address)

//  bytes32 constant ADMIN = keccak256("ADMIN");
//  kecccak = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN"))
//   console.log(kecccak)

//  grant = await OwnershipFacet.grantRole(kecccak, "0xd43bfF59Ce1547DfF02C75265adB7b3BDd993891")





}

// Get Asset, Submit Beneficary  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// let txGetLockedAsset = await faucet2.getLockedAsset(9)
// console.log(txGetLockedAsset, "Asset 9");

// console.log("NFT OWNER Be", await gemChest.ownerOf(9));

// TxClaim = await faucet1.claim(1, "0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e");





if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}


exports.deployDiamond = deployDiamond