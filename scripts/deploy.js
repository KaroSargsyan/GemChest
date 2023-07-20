const { ethers } = require('hardhat')
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function deployDiamond () {
  
  let path = "IERC20"

  
  const WMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
  const SIGNER = "0xd43bfF59Ce1547DfF02C75265adB7b3BDd993891";

  let QUOTER = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
  let UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564'; 

  [contractOwner1] = await ethers.getSigners();
  
  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
  const diamondCutFacet = await DiamondCutFacet.deploy()
  await diamondCutFacet.deployed()
  console.log('DiamondCutFacet deployed:', diamondCutFacet.address)

  // deploy Diamond
  const Diamond = await ethers.getContractFactory('Diamond')
  const diamond = await Diamond.deploy(contractOwner1.address, diamondCutFacet.address)
  await diamond.deployed()
  console.log('Diamond deployed:', diamond.address)

  const DiamondInit = await ethers.getContractFactory('DiamondInit')
  const diamondInit = await DiamondInit.deploy()
  await diamondInit.deployed()
  console.log('DiamondInit deployed:', diamondInit.address)

  // deploy facets
  const GemChest= await ethers.getContractFactory('GemChest')
  const gemChest= await GemChest.deploy(diamond.address) 
  await gemChest.deployed()
  console.log(`GemChest deployed: ${gemChest.address}`)


  console.log('')
  console.log('Deploying facets')
  const FacetNames = [
    'DiamondLoupeFacet',
    'OwnershipFacet',
    'Faucet1',
    'Faucet2',
  ]
  
  const cut = []
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName)
    const facet = await Facet.deploy()
    await facet.deployed()
    console.log(`${FacetName} deployed: ${facet.address}`)
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    })
  }

  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
  let tx
  let receipt
  let functionCall = diamondInit.interface.encodeFunctionData('init')
  tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  
  Faucet1= await ethers.getContractAt("Faucet1", diamond.address)
  Faucet2= await ethers.getContractAt("Faucet2", diamond.address)

  await Faucet1.initialize(gemChest.address, SIGNER, QUOTER, UNISWAP_V3_ROUTER, WMATIC)

  // const diamondCutFacett = await hre.ethers.getContractAt("DiamondCutFacet", diamond.address);

  // const selectors = getSelectors(diamondCutFacett);

  // tx = await diamondCutFacet.diamondCut(
  //   [{
  //     facetAddress: ethers.constants.AddressZero,
  //     action: FacetCutAction.Remove,
  //     functionSelectors: selectors
  //   }],
  //   ethers.constants.AddressZero, '0x');
  //   receipt = await tx.wait();
  //   if (!receipt.status) {
  //     throw Error(`Diamond upgrade failed: ${tx.hash}`);
  //   }

  // console.log("DONE!!")
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