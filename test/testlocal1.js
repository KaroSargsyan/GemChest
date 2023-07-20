const {loadFixture,time} = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, upgrades, utils } = require("hardhat");
const { getSelectors, FacetCutAction } = require('../scripts/libraries/diamond.js')
const hre = require("hardhat");
const { expect } = require("chai"); 
// const BigNumber = require('bignumber.js');


const LINK = "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39"; 
const DAI = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063';
const USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const WMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
const WETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";

const SIGNER = "0xd43bfF59Ce1547DfF02C75265adB7b3BDd993891";
let QUOTER = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
let UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564'; 


const COIN_WHALE = "0x3bcC4EcA0a40358558ca8D1bcd2d1dBdE63eB468";
// const COIN_WHALE = "0x72A53cDBBcc1b9efa39c834A540550e23463AAcB";
const pricefeed_link = "0xd9FFdb71EbE7496cC440152d43986Aae0AB76665";
const pricefeed_usdt = '0x0A6513e40db6EB1b165753AD52E80663aeA50545';
const pricefeed_usdc = '0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7';
const pricefeed_eth = '0xF9680D99D6C9589e2a93a78A04A279e509205945';
const pricefeed_dai = '0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D';
const pricefeed_weth = '0xF9680D99D6C9589e2a93a78A04A279e509205945';
const pricefeed_wmatic = '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0';
let path = "IERC20"

let duration = 31536000;


describe("Lock", function () {
  let contractOwner1;
  let contractOwner2;
  let link;
  let coin_whale;
  let dai;
  let usdt;
  let usdc;
  let weth;
  let wmatic;

  async function deployTokenFixture(){
    [contractOwner1,contractOwner2] = await ethers.getSigners();
    coin_whale = await ethers.getImpersonatedSigner(COIN_WHALE);
    link = await ethers.getContractAt(path, LINK);
    dai  = await ethers.getContractAt(path, DAI);
    usdt = await ethers.getContractAt(path, USDT);
    usdc = await ethers.getContractAt(path, USDC);
    weth = await ethers.getContractAt(path, WETH);
    wmatic = await ethers.getContractAt(path, WMATIC);


    const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
    const diamondCutFacet = await DiamondCutFacet.deploy()
    await diamondCutFacet.deployed()
    console.log('DiamondCutFacet deployed:', diamondCutFacet.address)

    const Diamond = await ethers.getContractFactory('Diamond')
    const diamond = await Diamond.deploy(contractOwner1.address, diamondCutFacet.address)
    await diamond.deployed()
    console.log('Diamond deployed:', diamond.address)

    const DiamondInit = await ethers.getContractFactory('DiamondInit')
    const diamondInit = await DiamondInit.deploy()
    await diamondInit.deployed()
    console.log('DiamondInit deployed:', diamondInit.address)

    const CoinChest= await ethers.getContractFactory('GemChest')
    const gemChest= await CoinChest.deploy(diamond.address) 
    await gemChest.deployed()
    console.log(`GemChest deployed: ${gemChest.address}`)
    
    const FacetNames = [
      'DiamondLoupeFacet',
      'OwnershipFacet',
      'Faucet1',
      'Faucet2'
    ]

    const facets = []
    const cut = []
    for (const FacetName of FacetNames) {
      const Facet = await ethers.getContractFactory(FacetName)
      facet = await Facet.deploy()
      await facet.deployed()
      console.log(`${FacetName} deployed: ${facet.address}`)
      cut.push({
        facetAddress: facet.address,
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(facet)
      })
      facets.push(facet.address)
    }

    // const Faucet3forTest = await ethers.getContractFactory('Faucet3forTest');
    // const faucet3forTest = await Faucet3forTest.deploy();
    // await faucet3forTest.deployed();

    const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address);
    let tx;
    let receipt;
    let functionCall = diamondInit.interface.encodeFunctionData('init');
    tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall);
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    
    const Faucet1= await ethers.getContractAt("Faucet1",diamond.address);
    const Faucet2= await ethers.getContractAt("Faucet2",diamond.address);
    const OwnershipFacet = await ethers.getContractAt("OwnershipFacet", diamond.address);
    // Faucet3 = await ethers.getContractAt("Faucet3forTest",diamond.address);

    await Faucet1.initialize(gemChest.address, SIGNER, QUOTER, UNISWAP_V3_ROUTER, WMATIC);

    console.log("Owner1", contractOwner1.address);
    console.log("Owner2", contractOwner2.address);


    return {contractOwner1,contractOwner2,link,dai,coin_whale,diamondCutFacet,diamondInit,Faucet1,Faucet2,OwnershipFacet,gemChest,diamond,pricefeed_usdt,usdt};
  }

  describe ("Deposit and Claim",() => {
    it('locked assets should be deposited, checked and claimed 1', async () => {
      const{Faucet1, Faucet2, contractOwner1,gemChest,diamond,link,dai,weth} = await loadFixture(deployTokenFixture);

      let txSettFixedFees = await Faucet2.setFee(0,0,0,[[1000000000,10],[5000000000, 5], [10000000000, 3]])
      
      let txAdd1 = await Faucet2.addToken("0x0000000000000000000000000000000000000000",0,"0x0000000000000000000000000000000000000000", 0);
      let txAdd2 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd3 = await Faucet2.addToken(USDT,1,pricefeed_usdt,8);
      let txAdd4 = await Faucet2.addToken(USDC,1, pricefeed_usdc,8);
      let txAdd5 = await Faucet2.addToken(WMATIC,1,pricefeed_wmatic, 18);
      let txAdd6 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);

      let txApprove1 = await usdc.connect(coin_whale).approve(diamond.address, 12000000000000);
      let txApprove2 = await link.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
      let txApprove3 = await wmatic.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);

      let options={
        value: 11000000000
       }

      const amount = 1000000000000000000n;

      let txDeposit1 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],amount,0, duration,200,[false,false], 'aaa');
      // let txDeposit2 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],amount,0, duration,200,[false,false], 'aaa');
      // let txDeposit3 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],amount,0, duration,200,[false,false], 'aaa');
      
      
      //Emits events from the appropriate log
      const receipt0 = await txDeposit1.wait();
      for (const event of receipt0.events) {
        console.log(`Event++++++++++++++++ ${event.event} with args ${event.args}`);
      }

      expect(await link.balanceOf(diamond.address)).to.equal(1100000000000000000n);

      // let yyyyy= await Faucet2.getAmountOutMin(LINK, DAI, amount);
      console.log("Link Balance of a contract after deposit", await link.balanceOf(diamond.address));
      console.log("Dai Balance of a contract after deposit", await dai.balanceOf(diamond.address));

      checkedArrays = await Faucet2.connect(coin_whale).checkClaim([1]);
      expect(await link.balanceOf(diamond.address)).to.equal(1100000000000000000n);
      
      //Time manipulations
      const timestamp_bef = await time.latest()
      console.log("timestamp", timestamp_bef)
      let timeNow = await time.latest()
      let newTime = timeNow + duration
      await time.increaseTo(newTime);
      // const timestamp_aft = await time.latest()
      // console.log("timestamp", timestamp_aft)
      // -----------------
      

      TxClaim = await Faucet1.claim(1,DAI);
      let xx =  await dai.balanceOf(diamond.address)
      console.log("*-*-*-*-*-*-*-*2222222222aft", await dai.balanceOf(diamond.address))
      console.log("*-*-*-*-*-*-*-*3333333333", await link.balanceOf(diamond.address))

    })
  
    it('locked assets should be deposited, checked and claimed: 2', async () => {
      const{Faucet1, Faucet2, contractOwner1, diamond} = await loadFixture(deployTokenFixture);
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd2 = await Faucet2.addToken(USDC,1,pricefeed_usdc, 18);
      let txAdd3 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);


      let txSettFixedFees = await Faucet2.setFee(0,0,0,[[1000000000,10],[5000000000, 5], [10000000000, 3]])

      const amount = 2505050505050;
      const duration = 1743743187;

      let TxApprove = await link.connect(coin_whale).approve(Faucet1.address, 2000000000000000);  
      let TxDeposit = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],amount, 0, duration,200,[true,false], 'aaa');
      
      let TxViewLockAsset= await Faucet2.getLockedAsset(1);
      console.log("TxViewLockAsset", TxViewLockAsset);

      let TxGetAmountsOut= await Faucet2.getAmountOutMin(LINK, USDT, 20000000000000);
      console.log("getAmountOutMin", TxGetAmountsOut);
      let balanceUSDC_before = console.log('balanceUSDC_before', await usdt.balanceOf(COIN_WHALE));


      //Time manipulations
      const timestamp_bef = await time.latest()
      console.log("timestamp", timestamp_bef)
      let timeNow = await time.latest()
      let newTime = timeNow + duration
      await time.increaseTo(newTime);
      // const timestamp_aft = await time.latest()
      // console.log("timestamp", timestamp_aft)
      // -----------------

      //Claim
      let TxClaim = await Faucet1.claim(1,DAI);
      let balanceUSDC_after = console.log('balanceUSDC_after', await usdt.balanceOf(COIN_WHALE));

      expect(await link.balanceOf(diamond.address)).to.equal(250505050505);

    })
  })

  describe ("Check Fees", () => {
    it ("check giftreward transaction", async () => {
      const{Faucet1, Faucet2, contractOwner1, diamond} = await loadFixture(deployTokenFixture);
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd2 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);
      let TxApprove = await link.connect(coin_whale).approve(Faucet1.address, 2000000000000000);  

      let txSettFixedFees = await Faucet2.setFee(0,0,10,[[1000000000,10],[5000000000, 5], [10000000000, 3]])

      const amount = 1000000000000;
      const duration = 1743743187;

      let TxDeposit = await Faucet1.connect(coin_whale).deposit([LINK, contractOwner1.address, contractOwner2.address],amount, 0, duration,200,[true,true], 'aaa');

      let TxViewLockAsset= await Faucet2.getLockedAsset(1);
      console.log("TxViewLockAsset", TxViewLockAsset);

      let exchanged_amount= await Faucet2.getAmountOutMin(LINK, DAI, amount);
      let exchanged_amount_giftreward= await Faucet2.getAmountOutMin(LINK, DAI, amount/10);

      //Time manipulations
      const timestamp_bef = await time.latest()
      console.log("timestamp", timestamp_bef)
      let timeNow = await time.latest()
      let newTime = timeNow + duration
      await time.increaseTo(newTime);
      // const timestamp_aft = await time.latest()
      // console.log("timestamp", timestamp_aft)
      // -----------------

      //Claim
      const coinWhaleBalance = await dai.balanceOf(coin_whale.address)
      const coinWhaleBalanceDaiBef =  ethers.BigNumber.from(coinWhaleBalance)

      let TxClaim = await Faucet1.claim(1,DAI);

      const giftReward = ethers.BigNumber.from((Math.floor(exchanged_amount_giftreward)))
      const coinWhaleBalanceDaiAft = coinWhaleBalanceDaiBef.add(giftReward)

      expect(await dai.balanceOf(coin_whale.address)).to.equal(coinWhaleBalanceDaiAft);
      expect(await link.balanceOf(diamond.address)).to.equal(90000000000);
    })


    it ("check affiliate", async () => {
      const{Faucet1, Faucet2, contractOwner1, diamond} = await loadFixture(deployTokenFixture);
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd2 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);
      let TxApprove = await link.connect(coin_whale).approve(Faucet1.address, 2000000000000000);  

      let txSettFixedFees = await Faucet2.setFee(0,0,3,[[1000000000,10],[5000000000, 5], [10000000000, 3]])

      const amount = 1000000000000;

      const duration = 1743743187;

      const cont2BalanceLinkBef = await link.balanceOf(contractOwner2.address)
      let TxDeposit = await Faucet1.connect(coin_whale).deposit([LINK, contractOwner1.address, contractOwner2.address],amount, 0, duration,200,[true,true], 'aaa');
      const cont2BalanceLinkAft= await link.balanceOf(contractOwner2.address)

      console.log("cont2BalanceLinkBef", cont2BalanceLinkBef);
      console.log("cont2BalanceLinkAft", cont2BalanceLinkAft);

      expect(await link.balanceOf(contractOwner2.address)).to.equal((amount*0.1)*0.03);


      // let TxViewLockAsset= await Faucet2.getLockedAsset(1);
      // console.log("TxViewLockAsset", TxViewLockAsset);

      //Claim
    
      // expect(await dai.balanceOf(coin_whale.address)).to.equal(coinWhaleBalanceDaiAft);
      // expect(await link.balanceOf(diamond.address)).to.equal(90000000000);
    })


  })


describe ("MATIC Transactions",() => {
  it('eth can be locked', async () => {
    const{Faucet1,Faucet2, contractOwner1, diamond} = await loadFixture(deployTokenFixture);
    let txAdd1 = await Faucet2.addToken("0x0000000000000000000000000000000000000000",0,"0x0000000000000000000000000000000000000000", 0)
    let txAdd2 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
    let txAdd3 = await Faucet2.addToken(ETH,1,pricefeed_eth, 18);
    let txAdd4 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);
    let txAdd5 = await Faucet2.addToken(USDT,1,pricefeed_usdt, 18);

    let txSettFixedFees = await Faucet2.setFee(0,0,0,[[1000000000,10],[5000000000, 5], [10000000000, 3]])
    
    const amount = 100000000000000
    const amountETH = 300000000000000
    let options={
      value: amountETH
     }

    //  TxDeposit0 = await Faucet1.deposit([ ETH, contractOwner1.address, '0x0000000000000000000000000000000000000000'], 9999, 1743743187, [[200, 100]],false, true, 'uuiddd', options)

    console.log("OWNER1 Balance of Eth BEFORE: ", await ethers.provider.getBalance(contractOwner1.address));
    console.log("contractOwner2 Balance of Eth BEFORE: ", await ethers.provider.getBalance(contractOwner2.address));
    console.log("DIAMOND Balance of Eth AFTER: ", await ethers.provider.getBalance(diamond.address));

    let TxDeposit1 = await Faucet1.deposit([ ETH, contractOwner1.address, contractOwner2.address], amount, 0,duration,200,[true,false], 'uuiddd', options);
    let TxDeposit2 = await Faucet1.deposit([ ETH, contractOwner1.address, contractOwner2.address], amount, 5555555555,duration,200,[true,false], 'uuiddd', options);
    console.log("DIAMOND Balance of Eth AFTER DEPOSIT BEFORE CLAIM: ", await ethers.provider.getBalance(diamond.address));

    console.log("OWNER1 Balance of Eth AFTER: ", await ethers.provider.getBalance(contractOwner1.address));

    expect( await ethers.provider.getBalance(diamond.address)).to.equal(2*amountETH);

    //Time manipulations
    const timestamp_bef = await time.latest()
    console.log("timestamp", timestamp_bef)
    let timeNow = await time.latest()
    let newTime = timeNow + duration
    await time.increaseTo(newTime);
    // const timestamp_aft = await time.latest()
    // console.log("timestamp", timestamp_aft)
    // -----------------

    
    TxClaim1 = await Faucet1.claim(1, USDT);
    TxClaim2 = await Faucet1.claim(2, USDT);

    console.log("DIAMOND Balance of Eth AFTER DEPOSIT AFTER CLAIM: ", await ethers.provider.getBalance(diamond.address));

    let TxDeposit3 = await Faucet1.deposit([ ETH, contractOwner1.address, contractOwner2.address], 100000000000000, 0,duration,200,[true,false], 'uuiddd', options);

    // expect(await link.balanceOf(diamond.address)).to.equal(250505050505);

    let afterClaim = await  Faucet2.getLockedAsset(1);
    
    console.log('Claimed');
    console.log(afterClaim);
    console.log("DIAMOND Balance of Eth AFTER CLAIM: ", await ethers.provider.getBalance(diamond.address));

    expect((await  Faucet2.getLockedAsset(1))[1]).to.equal(contractOwner1.address);

  })
}) 


  describe ("Transfer Beneficary Testing",() => {
    it('should transfer the nft with transferB()', async() =>{
      const{Faucet1,Faucet2,contractOwner1,coin_whale,gemChest,link} = await loadFixture(deployTokenFixture);

      let txSettFixedFees = await Faucet2.setFee(0,0,0,[[1000000000,10],[5000000000, 5], [10000000000, 3]])
      
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd2 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);

      let TxApprove = await link.connect(coin_whale).approve(Faucet1.address, 1000000000000000);
      
      let TxDeposit1 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],100000000000000,0, duration,300,[true, true], 'aaa');   
      console.log(await gemChest.ownerOf(1), "1 OWNER Before");
      console.log("getLockedAsset 1 Before", await  Faucet2.getLockedAsset(1));
      let TxFromNftTransfer = await gemChest.connect(coin_whale).transfer(coin_whale.address,contractOwner1.address,1);
      console.log("getLockedAsset 1 After", await  Faucet2.getLockedAsset(1));
      console.log(await gemChest.ownerOf(1), "1 OWNER After");

      expect((await  Faucet2.getLockedAsset(1))[1]).to.equal(contractOwner1.address);
      expect(await gemChest.ownerOf(1)).to.equal(contractOwner1.address);

    })

    it('should transfer the nft and lockedAsset using TransferBeneficiary()', async() =>{  //Test Again
      const{Faucet1,Faucet2,contractOwner1,coin_whale,gemChest,link, diamond}= await loadFixture(deployTokenFixture);

      console.log(COIN_WHALE, "Coin Whale");
      console.log(contractOwner1.address, "Owner1 Address");
      console.log(contractOwner2.address, "Owner2 Address");

      let txSettFixedFees = await Faucet2.setFee(0,0,10,[[1000000000,10],[5000000000, 5], [10000000000, 3]])
      
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd2 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);

      let TxApprove = await link.connect(coin_whale).approve(Faucet1.address, 1000000000000000);
      const amount = 100000000000000;
      let TxDeposit1 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],amount,0, duration,300,[true, true], 'aaa');
      let TxDeposit2 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],amount,0, duration,300,[true, true], 'aaa');
      console.log(await gemChest.ownerOf(2), "2 OWNER Before");
      console.log("getLockedAsset 2 Before", await  Faucet2.getLockedAsset(2));
      let TxTransferBeneficary = await Faucet1.connect(coin_whale).TransferBeneficiary(contractOwner2.address, 2);
      console.log("getLockedAsset 2 After", await  Faucet2.getLockedAsset(2));
      console.log(await gemChest.ownerOf(2), "2 OWNER After");

      expect(await gemChest.ownerOf(1)).to.equal(coin_whale.address);
      expect(await gemChest.ownerOf(2)).to.equal(contractOwner2.address);

    })


    it('should transfer the nft and lockedAsset', async() =>{
      const{Faucet1,Faucet2,contractOwner1,coin_whale,gemChest,link}= await loadFixture(deployTokenFixture);
      let txSettFixedFees = await Faucet2.setFee(0,0,0,[[1000000000,10],[5000000000, 5], [10000000000, 3]])

      const amount = 100000000000000
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
      let txAdd2 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);

      TxApprove = await link.connect(coin_whale).approve(Faucet1.address, 300000000000000);

      TxDeposit1 = await Faucet1.connect(coin_whale).deposit([LINK,coin_whale.address,contractOwner2.address],amount,0, duration,300,[true, true], 'aaa');     

      expect((await  Faucet2.getLockedAsset(1))[1]).to.equal(coin_whale.address);

      TxFromNftTransfer = await gemChest.connect(coin_whale).transfer(coin_whale.address,contractOwner1.address,1);

      expect((await  Faucet2.getLockedAsset(1))[1]).to.equal(contractOwner1.address);

      TxDeposit2 = await Faucet1.connect(coin_whale).deposit([LINK,coin_whale.address,contractOwner2.address],100000000000000,0, duration,300,[true, true], 'aaa');
 
      expect((await  Faucet2.getLockedAsset(2))[1]).to.equal(coin_whale.address);

      TxTransferBeneficary = await Faucet1.connect(coin_whale).TransferBeneficiary(contractOwner1.address,2)

      expect((await  Faucet2.getLockedAsset(2))[1]).to.equal(contractOwner1.address);

    })
})

describe ("Check Contract Balance Operations", () => {
  it ("check swapTokenBalance", async () => {
    const{Faucet1,Faucet2,contractOwner1,coin_whale,gemChest,link, diamond}= await loadFixture(deployTokenFixture);
    let txSettFixedFees = await Faucet2.setFee(0,0,0,[[1000000000,10],[5000000000, 5], [10000000000, 3]])

    let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
    let txAdd2 = await Faucet2.addToken(USDC,1,pricefeed_usdc,18);
    let txAdd3 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);

    let TxApprove1 = await link.connect(coin_whale).approve(Faucet1.address, 1000000000000000);
    let TxApprove2 = await usdc.connect(coin_whale).approve(Faucet1.address, 1000000000000000);
    let TxApprove3 = await dai.connect(coin_whale).approve(Faucet1.address, 1000000000000000);

    tokenAmount1 =await Faucet2.getToken(LINK);
    console.log(tokenAmount1, "tokenAmount1");

    const amount = 100000000000000

    TxDeposit1 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],amount,0, duration,300,[true, true], 'aaa');      
    
    tokenAmount2 =await Faucet2.getToken(LINK);
    console.log(tokenAmount2, "tokenAmount2");
    
    let bfr_link= await link.balanceOf(diamond.address);
    Faucet2.swapTokenBalance(LINK, DAI);
    let aft_link= await link.balanceOf(diamond.address);
    let aft_dai= await dai.balanceOf(contractOwner1.address);

    console.log("bfr_link", bfr_link);
    console.log("aft_dai", aft_dai);

    tokenAmount3 =await Faucet2.getToken(LINK);
    console.log(tokenAmount3, "tokenAmount3");

    expect((await Faucet2.getToken(LINK))[2]).to.equal(0);
    expect(await link.balanceOf(diamond.address)).to.equal(amount);

  })
})


  describe ("Bulk Claim", () => {
    it.only ("calim given asset id's", async() =>{
      const{Faucet1,Faucet2,contractOwner1,coin_whale,gemChest,link, diamond}= await loadFixture(deployTokenFixture);

      let txAdd2 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
      let txAdd3 = await Faucet2.addToken(USDC,1,pricefeed_usdc,6);
      let txAdd4 = await Faucet2.addToken(ETH,1,pricefeed_usdc,18);
      let txAdd5 = await Faucet2.addToken(DAI,1,pricefeed_usdc,8);
  
      let txSettFixedFees = await Faucet2.setFee(0, 1, 1, 5, 1,[[1000000000,10],[5000000000, 5], [10000000000, 3]])
      let TxApprove1 = await link.connect(coin_whale).approve(Faucet1.address, 25050505050500);
      let TxApprove2 = await usdc.connect(coin_whale).approve(Faucet1.address, 25050505050500);
      let TxApprove3 = await dai.connect(coin_whale).approve(Faucet1.address, 25050505050500);

      let options={
        value: 1100000000000000000n
       }
       const depositParams = {
          _addr: [ETH, contractOwner1.address, contractOwner1.address],
          _amount:1000000000000000000n,
          _otherFees: 0,
          _endDate: 1743743187,
          _target: 200,
          _features:[true, false, true],
          _uuid: "AAA-UUID"
        }
      
      console.log("OWNER1 Balance : ", await ethers.provider.getBalance(contractOwner1.address));
      console.log("DIamond Balance : ", await ethers.provider.getBalance(diamond.address));
      console.log("DIamond Balance USDC", await usdc.balanceOf(diamond.address))
      console.log("owner1 Balance USDC" ,await usdc.balanceOf(contractOwner1.address))
      console.log("______________________________________________________________________")


      let TxDeposit01 = await Faucet1.deposit(depositParams, options);

      console.log("OWNER1 Balance : ", await ethers.provider.getBalance(contractOwner1.address));
      console.log("DIamond Balance : ", await ethers.provider.getBalance(diamond.address));
      console.log("DIamond Balance USDC", await usdc.balanceOf(diamond.address))
      console.log("owner1 Balance USDC" ,await usdc.balanceOf(contractOwner1.address))
      console.log("______________________________________________________________________")


      // let TxDeposit02 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],2505050505050,0, duration ,200,[true,false], 'aaa');
      // let TxDeposit03 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],2505050505050,0, duration ,200,[true,false], 'aaa');
      // let TxDeposit04 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],2505050505050,0, duration ,200,[true,false], 'aaa');
      // let TxDeposit05 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],2505050505050,0, duration ,200,[true,false], 'aaa');
      // let TxDeposit06 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],2505050505050,0, duration ,200,[true,false], 'aaa');
      // let TxDeposit07 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],2505050505050,0, duration ,200,[true,false], 'aaa');
      // let TxDeposit08 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],2505050505050,0, duration ,200,[true,false], 'aaa');
      // let TxDeposit09 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],2505050505050,0, duration ,200,[true,false], 'aaa');
      
      //Time manipulations
      const timestamp_bef = await time.latest()
      let timeNow = await time.latest()
      let newTime = timeNow + 1743743187
      await time.increaseTo(newTime);
      // const timestamp_aft = await time.latest()
      // console.log("timestamp", timestamp_aft)
      // -----------------
      let txClaim2 = await Faucet1.claim(1, USDC);


      console.log("OWNER1 Balance : ", await ethers.provider.getBalance(contractOwner1.address));

      console.log("DIamond Balance : ", await ethers.provider.getBalance(diamond.address));

      console.log("DIamond Balance USDC", await usdc.balanceOf(diamond.address))

      console.log("owner1 Balance USDC" ,await usdc.balanceOf(contractOwner1.address))
      console.log("______________________________________________________________________")


      // try {
      //   let checkedArrays = await Faucet2.connect(coin_whale).checkClaim([1,2,3,4,78]);
      //   console.log(checkedArrays, "checkClaim1")
      //   let txbulkClaim = await Faucet1.bulkClaim([1,2,3,4,5,6,7,8,9], DAI);
      // } catch(err) {
      //   console.log("errrrrrrrrrrrror");
      //   console.log(err.message);
      // } finally {
      //   let checkedArrays = await Faucet2.connect(coin_whale).checkClaim([1,2,3,4,78]);
      //   console.log(checkedArrays), "checkClaim2";
      // }
      console.log("!!DONE")
    })
  })


describe ("Check Contract as Beneficary", () => {
  it ("check submitBeneficiary", async () => {
    const{Faucet1,Faucet2,contractOwner1,coin_whale,gemChest,link, diamond}= await loadFixture(deployTokenFixture);

    let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
    let txAdd2 = await Faucet2.addToken(USDC,1,pricefeed_usdc,8);
    let txAdd3 = await Faucet2.addToken(ETH,1,pricefeed_usdc,18);
    let txAdd4 = await Faucet2.addToken(DAI,1,pricefeed_usdc,8);

    let txSettFixedFees = await Faucet2.setFee(0,0,0,[[1000000000,10],[5000000000, 5], [10000000000, 3]])

    let TxApprove1 = await link.connect(coin_whale).approve(Faucet1.address, 25050505050500);
    let TxApprove2 = await usdc.connect(coin_whale).approve(Faucet1.address, 25050505050500);
    let TxApprove3 = await dai.connect(coin_whale).approve(Faucet1.address, 25050505050500);

      let options={
      value: 300000000000000
     }

      let txDeposit1 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],2505050505050,0, duration,200,[false,false], 'aaa');
   
    let TxViewLockAsset1= await Faucet2.getLockedAsset(1);
    console.log(TxViewLockAsset1, "TxViewLockAsset1");
    const exchanged_amount = await Faucet2.getAmountOutMin(LINK, DAI, 2505050505050)
    
    expect(await link.balanceOf(diamond.address)).to.equal(2505050505050*1.1);
    expect(await gemChest.ownerOf(1)).to.equal(diamond.address);


    expect(await dai.balanceOf(diamond.address)).to.equal(0);
    expect( await dai.balanceOf(contractOwner1.address)).to.equal(0);

  //   console.log("Contract Balance of Eth : ", await ethers.provider.getBalance(diamond.address));

    expect(await gemChest.tokenURI(1)).to.equal("https://server.xlock.io/metadata/polygon/1/1.json");

    // await expect(
    //   await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],2505050505050,0, duration,200,[false,false], 'aaa')
    // ).to.changeTokenBalances(dai, [COIN_WHALE, diamond.address], [-50, 50]);

    //Time manipulations
    const timestamp_bef = await time.latest()
    console.log("timestamp", timestamp_bef)
    let timeNow = await time.latest()
    let newTime = timeNow + duration
    await time.increaseTo(newTime);
    // const timestamp_aft = await time.latest()
    // console.log("timestamp", timestamp_aft)
    // -----------------

    let txClaim2 = await Faucet1.claim(1, DAI);
    expect(await dai.balanceOf(diamond.address)).to.equal(exchanged_amount);

    let TxCkaimGift1 = await Faucet1.submitBeneficiary(1, "Hello", "0x6aa096e4886ecb822466300c0589d17f9793049ca34285c714f1771128b393672c0def34c8a92a097f87d4238991deacbddaf60d4929a5385e77638bc74768db1b", DAI, contractOwner1.address);

    expect(await dai.balanceOf(diamond.address)).to.equal(0);
    expect(await dai.balanceOf(contractOwner1.address)).to.equal(exchanged_amount);
    await expect(gemChest.tokenURI(1)).to.be.revertedWith("ERC721: invalid token ID");
    await expect(gemChest.ownerOf(1)).to.be.revertedWith("ERC721: invalid token ID");

    })

    it ("check Submit submitBeneficiary from BACKEND", async () => {
      const{Faucet1,Faucet2,contractOwner1,coin_whale,gemChest,link, diamond}= await loadFixture(deployTokenFixture);
  
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
      let txAdd2 = await Faucet2.addToken(USDC,1,pricefeed_usdc,8);
      let txAdd3 = await Faucet2.addToken(ETH,1,pricefeed_usdc,18);
      let txAdd4 = await Faucet2.addToken(DAI,1,pricefeed_usdc,8);
  
      let txSettFixedFees = await Faucet2.setFee(0,0,0,[[1000000000,10],[5000000000, 5], [10000000000, 3]])
  
      let TxApprove1 = await link.connect(coin_whale).approve(Faucet1.address, 25050505050500);
      let TxApprove2 = await usdc.connect(coin_whale).approve(Faucet1.address, 25050505050500);
      let TxApprove3 = await dai.connect(coin_whale).approve(Faucet1.address, 25050505050500);
  
      let options={
        value: 300000000000000
       }

       let amount = 2505050505050;

        let txDeposit1 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],amount,0, duration,200,[false, false],'aaa');
      //  let TxDeposit2 = await Faucet1.deposit([ETH, COIN_WHALE, contractOwner2.address],2000000, duration, [[200, 100]],true, false, 'aaa', options);

      // expect((await Faucet2.getLockedAsset(1))[1]).to.equal(diamond.address);
      
      const exchange_amount = await Faucet2.getAmountOutMin(LINK, DAI, amount)
      console.log("exchange_amount", exchange_amount)

      expect(await dai.balanceOf(diamond.address)).to.equal(0);
      expect( await dai.balanceOf(contractOwner1.address)).to.equal(0);


      //Time manipulations
      let timeNow = await time.latest()
      let newTime = timeNow + duration
      await time.increaseTo(newTime);
      // const timestamp_aft = await time.latest()
      // console.log("timestamp", timestamp_aft)
      // -----------------

      let txClaim1 = await Faucet1.claim(1, DAI);

      expect(await dai.balanceOf(diamond.address)).to.equal(exchange_amount);
  
      let TxCkaimGift1 = await Faucet1.submitBeneficiary(1, "Hello", "0x6aa096e4886ecb822466300c0589d17f9793049ca34285c714f1771128b393672c0def34c8a92a097f87d4238991deacbddaf60d4929a5385e77638bc74768db1b", DAI, contractOwner1.address);
      
      expect(await dai.balanceOf(diamond.address)).to.equal(0);
      expect(await dai.balanceOf(contractOwner1.address)).to.equal(exchange_amount);
      
    })
  })

  describe ("Check GemChest", () => {
    it ("check setBaseURI()", async () => {
      const{gemChest,Faucet1,Faucet2}= await loadFixture(deployTokenFixture);
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
      let txAdd2 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);

      let TxApprove1 = await link.connect(coin_whale).approve(Faucet1.address, 1000000000000000);
      let txSettFixedFees = await Faucet2.setFee(0,0,10,[[1000000000,10],[5000000000, 5], [10000000000, 3]])

      const amount = 100000000000000
      
      await expect(
        gemChest.safeMint(COIN_WHALE,1)
      ).to.be.revertedWith("Only Faucet1");

      const  url = "https://server.xlock.io/metadata/polygon/1/1.json"
      let txDeposit1 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],amount,0, duration,300,[true, true], 'aaa');      
      expect(await gemChest.tokenURI(1)).to.equal(url);
    })
  })

  describe ("ROLES", () => {
    it ("check roles", async () => {
      const{gemChest,Faucet1,Faucet2,OwnershipFacet}= await loadFixture(deployTokenFixture);

      let txSettFixedFees1 = await Faucet2.setFee(0,0,10,[[1000000000,10],[5000000000, 5], [10000000000, 3]])

      const labelhash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN"));
      // const labelhash = ethers.utils.id("ADMIN"))
      // await OwnershipFacet.revokeRole(labelhash, contractOwner1.address);

      await OwnershipFacet.grantRole(labelhash, contractOwner2.address);

      let txSettFixedFees3 = await Faucet2.connect(contractOwner2).setFee(0,0,100,[[1000000000,10],[5000000000, 5], [10000000000, 3]])

      await OwnershipFacet.revokeRole(labelhash, contractOwner2.address);
      await expect(Faucet2.connect(contractOwner2).setFee(0,0,100,[[1000000000,10],[5000000000, 5], [10000000000, 3]])).to.be.revertedWith('AccessControl: account  is missing role ');
    })
  })
})