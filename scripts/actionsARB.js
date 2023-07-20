/* global ethers */
/* eslint prefer-const: "off" */

const { ethers } = require('hardhat')

async function deployDiamond () {
  
  let path = "IERC20"

  const accounts = await ethers.getSigners();
  const USDC = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8';
  const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const ARB = "0x912CE59144191C1204E64559FE8253a0e49E6548";

  // const usdc = await ethers.getContractAt(path, USDC);  //or contracts/IERC20.sol:IERC20
  // const eth = await ethers.getContractAt(path, ETH);  //or contracts/IERC20.sol:IERC20

  const pricefeed_usdc = '0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3';
  const pricefeed_eth = "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612";
  const pricefeed_arb = "0xb2A824043730FE05F3DA2efaFa1CBbe83fa548D6";

  // let txSettFixedFees = await faucet2.setFee(0, 1, 1, 5, 1,[[1000000000,1],[10000000000, 2], [100000000000, 3]]) 

  // const contractOwner1 = accounts[0];
  // const contractOwner2 = accounts[1];

  const diamond_address = "0x382e6e4270D58eB426B0F24cf6cE8B616d6ab0E5"     ///// add after deploy change
  
  // const Diamond = await hre.ethers.getContractAt("Diamond", diamond_address);
  const faucet1 = await hre.ethers.getContractAt("Faucet1",diamond_address);
  // const faucet2 = await hre.ethers.getContractAt("Faucet2", diamond_address);

  // const OwnershipFacet = await hre.ethers.getContractAt("OwnershipFacet", diamond_address);
  // const gemChest = await hre.ethers.getContractAt("GemChest", '0x953d52468147A0f6110DDAd6907102d59A077714');
  
  
  // txAdd1 = await faucet2.addTokenn([ETH,USDC,ARB],[pricefeed_eth,pricefeed_usdc,pricefeed_arb],[1,1,1],[18,6,18])
  

  // await usdc.approve(faucet1.address, 10000000000);
  // await weth.approve(faucet1.address, 10000000000);

  // const depositParams = {
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

  // role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN"))
  // grant = await OwnershipFacet.grantRole(role, "0xd43bfF59Ce1547DfF02C75265adB7b3BDd993891")
  const provider = new ethers.providers.JsonRpcProvider("https://arbitrum-mainnet.infura.io/v3/94fb3c194f2b4b85bf6bae526ce5d12b");
  // const gasEstimate = await faucet1.estimateGas.bulkClaim([2],"0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8");
  // const gasPrice = await provider.getGasPrice();
  // console.log(gasPrice,"gasPrice")
  // const gasFee = gasEstimate.mul(gasPrice);
  // console.log('Gas fee:', ethers.utils.formatEther(gasFee), 'ETH');

  // const provider = new ethers.providers.JsonRpcProvider('<Arbitrum RPC URL>');
  // const contract = new ethers.Contract(contractAddress, contractAbi, provider);
  
  // const provider = new ethers.providers.JsonRpcProvider("https://arb-mainnet.g.alchemy.com/v2/8rRW61U1s1AuBwwIQDS4QhDSdpoG4aFt");
  // console.log(faucet1.address)
  // console.log(faucet1.interface)
  // console.log(accounts[0])

  const signer = new ethers.Wallet("17b090e06dce9613f3761216b9dc68a75629586961cd734d807cad5779164b0e").connect(provider);
  const estimatedGas = await signer.estimateGas({
    to: faucet1.address,
    data: faucet1.interface.encodeFunctionData('bulkClaim', [[4],"0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"]),
  });
  
  console.log('Estimated gas usage:', estimatedGas.toString());


  // const provider = new ethers.providers.JsonRpcProvider("https://arb-mainnet.g.alchemy.com/v2/8rRW61U1s1AuBwwIQDS4QhDSdpoG4aFt");
  // const faucetContract = new ethers.Contract("0x382e6e4270D58eB426B0F24cf6cE8B616d6ab0E5", faucet1.interface, provider);
  // const estimatedGas = await faucetContract.estimateGas.bulkClaim([2],"0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8");
  // console.log("Estimated Gas Limit:", estimatedGas.toNumber());

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


