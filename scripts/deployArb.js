const { ethers } = require('hardhat')
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function deployDiamond () {
  
  let path = "IERC20"

  
  const WETH = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1";
  const SIGNER = "0xd43bfF59Ce1547DfF02C75265adB7b3BDd993891";
  let QUOTER = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
  let UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564'; 
  [contractOwner1] = await ethers.getSigners();
  
  // deploy DiamondCutFacet
  // const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
  // const diamondCutFacet = await DiamondCutFacet.deploy()
  // await diamondCutFacet.deployed()
  // console.log('DiamondCutFacet deployed:', diamondCutFacet.address)

  // // deploy Diamond
  // const Diamond = await ethers.getContractFactory('Diamond')
  // const diamond = await Diamond.deploy(contractOwner1.address, diamondCutFacet.address)
  // await diamond.deployed()
  // console.log('Diamond deployed:', Diamond)

  // const DiamondInit = await ethers.getContractFactory('DiamondInit')
  // const diamondInit = await DiamondInit.deploy()
  // await diamondInit.deployed()
  // console.log('DiamondInit deployed:', diamondInit.address)

  // // deploy facets
  // const GemChest= await ethers.getContractFactory('GemChest')
  // const gemChest= await GemChest.deploy(Diamond) 
  // await gemChest.deployed()
  // console.log(`GemChest deployed: ${gemChest.address}`)

  // const DiamondCutFacet = 0x84A46DBA49b9f71c98557B87738FFE272009790B
  // const DiamondInit = 0x3c7306069F62956216d711c9f28f8E3719C063cE
  // const GemChest = 0x75eabDE6A42FF57E4DA7703FedA7756c510b954C
  
  // // const diamondCutFacet= await ethers.getContractAt("DiamondCutFacet",Diamond);
  // const gemChest= "0x75eabDE6A42FF57E4DA7703FedA7756c510b954C"
  
  // const wallet = new ethers.Wallet("17b090e06dce9613f3761216b9dc68a75629586961cd734d807cad5779164b0e");
  
  // const Diamond = "0x382e6e4270D58eB426B0F24cf6cE8B616d6ab0E5"
  // const diamondInit= await ethers.getContractAt("DiamondInit",Diamond);

  // const diamondInitFacet = await ethers.getContractFactory("DiamondInit");
  // const diamondInit = new ethers.Contract("0x3c7306069F62956216d711c9f28f8E3719C063cE", diamondInitFacet.interface, wallet)

  
  // const diamondInitAddress = "0x3c7306069F62956216d711c9f28f8E3719C063cE"

  // console.log('')
  // console.log('Deploying facets')




  // const FacetNames = [
  //   'DiamondLoupeFacet',
  //   'OwnershipFacet',
  //   'Faucet1'
  // ]
  
  // const FacuetAddresses = [
  //   "0x362EcCc5eB46B812014703e935326129207CD886",
  //   "0x0638722f66Dc508353eF4027E5Affb3d60BA0cbC",
  //   "0x78658500F725a3FD5504F0d6053D5765Ed5f2FfB"]

  // const cut = []

  // for (let i = 0; i < FacetNames.length; i++) {
  //   const Facet = await ethers.getContractFactory(FacetNames[i])
  //   const facet = new ethers.Contract(FacuetAddresses[i], Facet.interface, wallet)

  //   cut.push({
  //     facetAddress: facet.address,
  //     action: FacetCutAction.Add,
  //     functionSelectors: getSelectors(facet)
  //   })
  // }

  // const diamondCut = await ethers.getContractAt('IDiamondCut', Diamond)
  // let tx
  // let receipt
  // let functionCall = diamondInit.interface.encodeFunctionData('init')
  // tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall)
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Diamond upgrade failed: ${tx.hash}`)
  // }


  
  
  Faucet1= await ethers.getContractAt("Faucet1", "0x382e6e4270D58eB426B0F24cf6cE8B616d6ab0E5")
  // Faucet2= await ethers.getContractAt("Faucet2", "0x382e6e4270D58eB426B0F24cf6cE8B616d6ab0E5")


  // const WETH = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1";
  // const SIGNER = "0xd43bfF59Ce1547DfF02C75265adB7b3BDd993891";
  // let QUOTER = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
  // let UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564'; 

  // let tx = await Faucet1.initialize("0x75eabDE6A42FF57E4DA7703FedA7756c510b954C","0xd43bfF59Ce1547DfF02C75265adB7b3BDd993891","0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
  // "0xE592427A0AEce92De3Edee1F18E0157C05861564","0x82af49447d8a07e3bd95bd0d56f35241523fbab1")

  // await Faucet1.activateV2Contract("0x75eabDE6A42FF57E4DA7703FedA7756c510b954C")
  // let txSettFixedFees = await Faucet2.setFee(0, 1, 1, 5, 1,[[1000000000,1],[10000000000, 2], [100000000000, 3]]) 


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