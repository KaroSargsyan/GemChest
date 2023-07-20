const {loadFixture,} = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, upgrades } = require("hardhat");
const { getSelectors, FacetCutAction } = require('../scripts/libraries/diamond.js')
const hre = require("hardhat");
const { expect } = require("chai");
const { assert } = require('chai')

const LINK = '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39';
const DAI = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063';
const USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
const WMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";


let QUOTER = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
let UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564'; 

const COIN_WHALE = "0x3bcC4EcA0a40358558ca8D1bcd2d1dBdE63eB468";
const pricefeed_link = "0xd9FFdb71EbE7496cC440152d43986Aae0AB76665";
const pricefeed_usdt = '0x0A6513e40db6EB1b165753AD52E80663aeA50545';
const pricefeed_usdc = '0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7';
const pricefeed_eth = '0xF9680D99D6C9589e2a93a78A04A279e509205945'
let path = "IERC20"

describe("Lock", function () {
  let contractOwner1;
  let contractOwner2;
  let link;
  let coin_whale;
  let dai;
  let usdc;
  let usdt;

  

  const addresses = []

  async function deployTokenFixture(){
    [contractOwner1,contractOwner2] = await ethers.getSigners();
    coin_whale = await ethers.getImpersonatedSigner(COIN_WHALE);  
    link = await ethers.getContractAt(path, LINK);
    dai  = await ethers.getContractAt(path, DAI);
    usdt = await ethers.getContractAt(path, USDT);
    usdc = await ethers.getContractAt(path, USDC);
    
    let DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet');
    let diamondCutFacet = await DiamondCutFacet.deploy();
    await diamondCutFacet.deployed();
    console.log('DiamondCutFacet deployed:', diamondCutFacet.address);
    
    const Diamond = await ethers.getContractFactory('Diamond');
    const diamond = await Diamond.deploy(contractOwner1.address, diamondCutFacet.address);
    await diamond.deployed();
    console.log('Diamond deployed:', diamond.address);
    
    
    const DiamondInit = await ethers.getContractFactory('DiamondInit');
    const diamondInit = await DiamondInit.deploy();
    await diamondInit.deployed();
    console.log('DiamondInit deployed:', diamondInit.address);

    const GemChest= await ethers.getContractFactory('GemChest');
    const gemChest= await GemChest.deploy(diamond.address);
    await gemChest.deployed();
    console.log(`CoinChest deployed: ${gemChest.address}`);

    //Deploy Migration Contract 

    const V2Contract= await ethers.getContractFactory('V2Contract');
    const v2Contract= await V2Contract.deploy(diamond.address) ;
    await v2Contract.deployed();
    console.log(`v2Contract deployed: ${v2Contract.address}`);
    
    const FacetNames = [
      'DiamondLoupeFacet',
      'OwnershipFacet',
      'Faucet1',
      'Faucet2'
    ]

    const facets = []
    const cut = []
    for (const FacetName of FacetNames) {
      const Facet = await ethers.getContractFactory(FacetName);
      facet = await Facet.deploy();
      await facet.deployed();
      console.log(`${FacetName} deployed: ${facet.address}`);
      cut.push({
        facetAddress: facet.address,
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(facet)
      })
      facets.push(facet)
    }
    // const DiamondLoupeFacet = facets[0]
    // const ownershipFacet = facets[1]

    const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address);
    const DiamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamond.address);

    diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamond.address);
    ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamond.address);

    
    let tx;
    let receipt;
    let functionCall = diamondInit.interface.encodeFunctionData('init');
    tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall);
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }
    
    Faucet1= await ethers.getContractAt("Faucet1",diamond.address); 
    Faucet2= await ethers.getContractAt("Faucet2",diamond.address);

    await Faucet1.initialize(gemChest.address, contractOwner1.address, QUOTER, UNISWAP_V3_ROUTER, WMATIC);

    return {contractOwner1,contractOwner2,link,dai,coin_whale,DiamondLoupeFacet,ownershipFacet, diamondCutFacet, diamond, diamondInit,Faucet1,Faucet2, v2Contract ,gemChest,facets,diamond,pricefeed_usdt,usdt};
  }

  describe ("CHECK UPGRADES",() => {

    it("Test migrations to other contracts", async () => {
      const{Faucet1, Faucet2, contractOwner1,coinChest,facets,diamond,link,dai, diamondCutFacet, DiamondLoupeFacet,v2Contract} = await loadFixture(deployTokenFixture);
      console.log("bbbbb",v2Contract.address)

      let txAdd2 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txApprove2 = await link.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);

      const startFee = 0n;
      const unlockFee = 0n;
      const affiliateFee = 0n;
      const slippage = 20n;
      const giftRewardRate = 10n
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]]) 

      //Deposit
      const depositParams = {
        _addr: [LINK, coin_whale.address, contractOwner2.address],
        _amount:5000000000000000000n,
        _otherFees: 0,
        _endDate: 1743743187,
        _target: 200,
        _features:[true, false, false],
        _uuid: "AAA-UUID"
      }
      let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParams);
      
      txActivateContract = await Faucet1.activateV2Contract(v2Contract.address)
      
      console.log("aaaaaa", v2Contract.address)
      let txGetAssetF2 = await Faucet2.getLockedAsset(1)
      console.log(txGetAssetF2,"txGetAsset02")

      let txMigrate = await Faucet2.connect(coin_whale).migrateAsset(1)
      let txGetAssetV2 = await v2Contract.getLockedAsset(0)
      console.log(txGetAssetV2,"txGetAsset02")

      console.log(await link.balanceOf(diamond.address), "'Link AFTER deposit Diamond");
      console.log(await link.balanceOf(v2Contract.address), "'Link AFTER deposit V2");

    })
    

    it('should have three facets -- call to facetAddresses function', async () => {
        const{Faucet1, Faucet2, contractOwner1,coinChest,facets,diamond,link,dai, diamondCutFacet, ownershipFacet, DiamondLoupeFacet} = await loadFixture(deployTokenFixture);
        // console.log(DiamondLoupeFacet)
        console.log(diamond.address, DiamondLoupeFacet.address, diamondCutFacet.address, ownershipFacet.address);
        console.log(DiamondLoupeFacet.facetAddresses());

        for (const address of await DiamondLoupeFacet.facetAddresses()) {
          console.log("DONE+");
          addresses.push(address);
        }
        console.log("DONE", addresses);
  })

  it('should add functions', async () => {
    const{Faucet1, Faucet2, contractOwner1,coinChest,facets,diamond,link,dai, diamondCutFacet, ownershipFacet, DiamondLoupeFacet} = await loadFixture(deployTokenFixture);
    
    const Faucet3forTest = await ethers.getContractFactory('Faucet3forTest');
    const faucet3forTest = await Faucet3forTest.deploy();
    await faucet3forTest.deployed();
    console.log('Faucet3forTest deployed:', faucet3forTest.address);
    console.log("333333", addresses);
    // 0x63751d771c4786a0e50F71346a7fb53f85Ba94aD

    addresses.push(faucet3forTest.address);
    const selectors = getSelectors(faucet3forTest);
    console.log("++++++",await ownershipFacet.address);
    tx = await diamondCutFacet.diamondCut(
      [{
        facetAddress: faucet3forTest.address,
        action: FacetCutAction.Add,
        functionSelectors: selectors
      }],
      ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    result = await DiamondLoupeFacet.facetFunctionSelectors(faucet3forTest.address);
    assert.sameMembers(result, selectors);

    const F3forTest = await ethers.getContractAt('Faucet3forTest', diamond.address);

    tx1 =await  F3forTest.printFromTest()
    console.log(tx1)

  })

  it('should remove functions', async () => {
    let { Faucet2, contractOwner1,coinChest,facets,diamond,link,dai, diamondCutFacet, ownershipFacet, DiamondLoupeFacet} = await loadFixture(deployTokenFixture);
    const Faucet1= await ethers.getContractAt("Faucet1",diamond.address); 

    // addresses.push(Faucet1.address)

    // const functionsToKeep = ['bulkClaim(uint[], address)'];
    // 0x0B87c5b5B578AbD963Da83381dD54A26D9e2F7B4
    const selectors = getSelectors(diamondCutFacet);
    // console.log("++++++",await ownershipFacet.address);

    // res = getSelectors(Faucet1);
    // console.log("RES Before ----------------------------------------------------------------", res);

    console.log(selectors)
    tx = await diamondCutFacet.diamondCut(
      [{
        facetAddress: ethers.constants.AddressZero,
        action: FacetCutAction.Remove,
        functionSelectors: selectors
      }],
      ethers.constants.AddressZero, '0x', { gasLimit: 800000 });
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }
    // console.log("addresses", addresses);
    // console.log("FFFF", Faucet1.address);
    result = await DiamondLoupeFacet.facetFunctionSelectors('0x604B179ce5607ed63def24D54f3Bce01d6FaC1B6');
    // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR", result);
    res = getSelectors(DiamondLoupeFacet);
    console.log("RES After ********************************************************", res);
    // console.log(await ownershipFacet.owner(), "OWNERRRRRRR")


    const Faucet3forTest = await ethers.getContractFactory('Faucet3forTest');
    const faucet3forTest = await Faucet3forTest.deploy();
    await faucet3forTest.deployed();
    console.log('Faucet3forTest deployed:', faucet3forTest.address);
    console.log("333333", addresses);
    // 0x63751d771c4786a0e50F71346a7fb53f85Ba94aD
    let txAdd2 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
    console.log(txAdd2, "txAdd2txAdd2txAdd2txAdd2txAdd2txAdd2txAdd2txAdd2")

    addresses.push(faucet3forTest.address);
    const selectorsd = getSelectors(faucet3forTest);
    console.log("++++++",await ownershipFacet.address);
    await expect(diamondCutFacet.diamondCut(
      [{
        facetAddress: faucet3forTest.address,
        action: FacetCutAction.Add,
        functionSelectors: selectorsd
      }],
      ethers.constants.AddressZero, '0x', { gasLimit: 800000 })).to.be.revertedWith('Diamond: Function does not exist')


    // assert.sameMembers(result, getSelectors(DiamondLoupeFacet).get(functionsToKeep));
  })

})
})