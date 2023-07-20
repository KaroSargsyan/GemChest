/* global ethers */
/* eslint prefer-const: "off" */

const { ethers } = require('hardhat')

async function deployDiamond () {
  
  let path = "IERC20"

  const accounts = await ethers.getSigners();
  const LINK = '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39';
  const USDC = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
  const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  // const link = await ethers.getContractAt(path, LINK);  //or contracts/IERC20.sol:IERC20
  // const usdc = await ethers.getContractAt(path, USDC);  //or contracts/IERC20.sol:IERC20
  // const eth = await ethers.getContractAt(path, ETH);  //or contracts/IERC20.sol:IERC20

  const pricefeed_link = "0x5787BefDc0ECd210Dfa948264631CD53E68F7802";
  const pricefeed_usdc = '0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7';
  const pricefeed_matic = "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0";

  // const contractOwner1 = accounts[0];
  // const contractOwner2 = accounts[1];

  const diamond_address = "0x382e6e4270D58eB426B0F24cf6cE8B616d6ab0E5"     ///// add after deploy change
  
  const Diamond = await hre.ethers.getContractAt("Diamond", diamond_address);
  const faucet1 = await hre.ethers.getContractAt("Faucet1", diamond_address);
  const faucet2 = await hre.ethers.getContractAt("Faucet2", diamond_address);

  const OwnershipFacet = await hre.ethers.getContractAt("OwnershipFacet", diamond_address);
  // const gemChest = await hre.ethers.getContractAt("GemChest", '0x953d52468147A0f6110DDAd6907102d59A077714');

  // txAdd1 = await faucet2.addToken(ETH, 1, pricefeed_matic, 18)
  // txAdd2 = await faucet2.addToken(LINK,1,pricefeed_link, 18)
  // txAdd3 = await faucet2.addToken(USDC,1,pricefeed_usdc, 6)

   addToken("0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619","0xF9680D99D6C9589e2a93a78A04A279e509205945",18)

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

  role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN"))
  grant = await OwnershipFacet.grantRole(role, "0xd43bfF59Ce1547DfF02C75265adB7b3BDd993891")



}



if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}


exports.deployDiamond = deployDiamond