const {loadFixture, time} = require("@nomicfoundation/hardhat-network-helpers");
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
const ZETA = "0x000080383847bD75F91c168269Aa74004877592f"

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



describe("Lock", function () {
  let contractOwner1;
  let contractOwner2;
  let contractOwner3;
  let link;
  let coin_whale;
  let dai;
  let usdt;
  let usdc;
  let weth;
  let wmatic;
  let endDate = 1743743187;


  async function deployTokenFixture(){
    [contractOwner1, contractOwner2, contractOwner3] = await ethers.getSigners();
    coin_whale = await ethers.getImpersonatedSigner(COIN_WHALE);
    link = await ethers.getContractAt(path, LINK);
    dai  = await ethers.getContractAt(path, DAI);
    usdt = await ethers.getContractAt(path, USDT);
    usdc = await ethers.getContractAt(path, USDC);
    weth = await ethers.getContractAt(path, WETH);
    wmatic = await ethers.getContractAt(path, WMATIC);

    let QUOTER = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
    let UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564'; 


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

    await Faucet1.initialize(gemChest.address, contractOwner3.address, QUOTER, UNISWAP_V3_ROUTER, WMATIC);

    console.log("Owner1", contractOwner1.address);
    console.log("Owner2", contractOwner2.address);
    console.log("______________________________________________________")
    console.log("")


    return {contractOwner1, contractOwner2, contractOwner2, link,dai, coin_whale,diamondCutFacet,diamondInit, Faucet1, Faucet2,OwnershipFacet,gemChest,diamond,pricefeed_usdt,usdt};
  }

  describe ("chack balance amounts",() => {
    it ('address balance will increase when deposited amount and decrise if claimed ot transfered', async () => {
      const{Faucet1, Faucet2, contractOwner1, gemChest ,diamond, link,dai} = await loadFixture(deployTokenFixture);
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd2 = await Faucet2.addToken(ETH,1, pricefeed_weth,18);
      let txAdd3 = await Faucet2.addToken(USDC,1, pricefeed_usdc,6);


      let txApprove1 = await usdc.connect(coin_whale).approve(diamond.address, 12000000000000);
      let txApprove2 = await link.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);

      const token = LINK;
      const tokenContract=link;
      const swaptoken = USDC; 
      const endDate = 1743743187;
      
      const amount = 1000000000000000000n;
      const feeRate = 0n;   //depends on the amount depositied
      const initFee = amount*feeRate/100n; 

      const unlockFee = 0n;

      const startFee = 0n;
      const affiliateFee = 0n;
      const slippage = 20n;
      const giftRewardRate = 0n
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,0],[5000000000, 0], [10000000000, 0]],3000,0)
      // let txTestGasUsage()= await Faucet1.Test()

  })
    it ('address balance will increase when deposited amount and decrise if claimed ot transfered', async () => {
      const{Faucet1, Faucet2, contractOwner1, gemChest ,diamond, link,dai} = await loadFixture(deployTokenFixture);
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd2 = await Faucet2.addToken(ETH,1, pricefeed_weth,18);
      let txAdd3 = await Faucet2.addToken(USDC,1, pricefeed_usdc,6);


      let txApprove1 = await usdc.connect(coin_whale).approve(diamond.address, 12000000000000);
      let txApprove2 = await link.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);

      const token = LINK;
      const tokenContract=link;
      const swaptoken = USDC; 
      const endDate = 1743743187;
      
      const amount = 1000000000000000000n;
      const feeRate = 0n;   //depends on the amount depositied
      const initFee = amount*feeRate/100n; 

      const unlockFee = 0n;

      const startFee = 0n;
      const affiliateFee = 0n;
      const slippage = 20n;
      const giftRewardRate = 0n
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,0],[5000000000, 0], [10000000000, 0]],3000,0)

      //Deposit

      // const depositParams = {
        // _addr: [token, contractOwner2.address, "0x0000000000000000000000000000000000000000"],
        // _amount:amount,
        // _otherFees: 700,
        // _endDate: endDate,
        // _target: 200,
        // _features:[true, false, false],
        // _uuid: "AAA-UUID",
        // _skinId : 111,
      // }

      // console.log(await tokenContract.balanceOf(coin_whale.address)) 

      // let = initbalance = await Faucet2.getBalanceOf(depositParams._addr[1],depositParams._addr[0])
      // console.log(initbalance, " ___ initBalance ")
      // expect((await Faucet2.getBalanceOf(depositParams._addr[1],depositParams._addr[0]))[0]).to.equal(0) 


      // let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParams);

      // let = balanceaftDeposit = await Faucet2.getBalanceOf(depositParams._addr[1], depositParams._addr[0])
      // console.log(balanceaftDeposit, " ___ aftDepositBalance ")
      // expect((await Faucet2.getBalanceOf(depositParams._addr[1],depositParams._addr[0]))[0]).to.equal(amount) 



      // const depositParams2 = {
      //   _addr: [ETH, contractOwner1.address, "0x0000000000000000000000000000000000000000"],
      //   _amount:200000000000000,
      //   _otherFees: 700,
      //   _endDate: endDate,
      //   _target: 200,
      //   _features:[true, false, false],
      //   _uuid: "AAA-UUID",
      //   _skinId : 111,
      // }

      const amountETH = 300000000000000;
      let options={
        value: amountETH
       }
      // let txDeposit2 = await Faucet1.deposit(depositParams2,options);

      // console.log((await Faucet2.getBalanceOf(depositParams2._addr[1],depositParams2._addr[0]))[0] ,"balanceOF contractOwner1")
      // console.log((await Faucet2.getBalanceOf(contractOwner2.address,depositParams2._addr[0]))[0] ,"balanceOF contractOwner2")
      // let TxTransferBeneficary = await Faucet1.connect(contractOwner1).transferBeneficiary(contractOwner2.address, 2);
      // console.log((await Faucet2.getBalanceOf(depositParams2._addr[1],depositParams2._addr[0]))[0] ,"balanceOF contractOwner1")
      // console.log((await Faucet2.getBalanceOf(contractOwner2.address,depositParams2._addr[0]))[0] ,"balanceOF contractOwner2")



      const depositParams3 = {
        _addr: [ETH, contractOwner3.address, "0x0000000000000000000000000000000000000000"],
        _amount:200000000000000,
        _otherFees: 700,
        _endDate: endDate,
        _target: 200,
        _features:[false, false, false],
        _uuid: "AAA-UUID",
        _skinId : 111,
      }
      
      console.log("-------------------------------------------------------------------------------------")
      console.log((await Faucet2.getBalanceOf(contractOwner1.address,depositParams3._addr[0]))[0] ,"balanceOF contractOwner1")
      console.log((await Faucet2.getBalanceOf(contractOwner3.address,depositParams3._addr[0]))[0] ,"balanceOF contractOwner3")
      
      let txDeposit3 = await Faucet1.deposit(depositParams3,options);
      
      console.log("-------------------------------------------------------------------------------------")
      console.log((await Faucet2.getBalanceOf(contractOwner1.address,depositParams3._addr[0]))[0] ,"balanceOF contractOwner1")
      console.log((await Faucet2.getBalanceOf(contractOwner3.address,depositParams3._addr[0]))[0] ,"balanceOF contractOwner3")
      
      await Faucet2.connect(contractOwner3).submitBeneficiary(1, "Hello", "0x7e130ea84cc85682ae4b16df92bb77b5541bf1ea16d559f7be1387582365611d299004a284c71d1a918f7a6996b34df4a7a11043450d4da9b0ad0655f7954ed91b", USDC, contractOwner1.address)
      
      console.log("-------------------------------------------------------------------------------------")
      console.log((await Faucet2.getBalanceOf(contractOwner1.address,depositParams3._addr[0]))[0] ,"balanceOF contractOwner1")
      console.log((await Faucet2.getBalanceOf(contractOwner3.address,depositParams3._addr[0]))[0] ,"balanceOF contractOwner3")


      // //Time manipulations
      // await time.increaseTo(endDate);
      // //------------------

      // //Claim

 
      const txClaim = await Faucet1.claim(1, swaptoken);
      // const txClaim2 = await Faucet1.connect(contractOwner2).claim(2, swaptoken);

      // console.log((await Faucet2.getBalanceOf(contractOwner2.address,depositParams2._addr[0]))[0] ,"balanceOF contractOwner2")
      // expect((await Faucet2.getBalanceOf(depositParams._addr[1],depositParams._addr[0]))[0]).to.equal(0)



    })
  })


  describe ("skin features",() => {
    it ('skin will added owner if there not subscribed account', async () => {
      const{Faucet1, Faucet2, contractOwner1, gemChest,diamond, link,dai} = await loadFixture(deployTokenFixture);
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd2 = await Faucet2.addToken(ETH,1, pricefeed_weth,18);
      let txAdd3 = await Faucet2.addToken(USDC,1, pricefeed_usdc,6);


      let txApprove1 = await usdc.connect(coin_whale).approve(diamond.address, 12000000000000);
      let txApprove2 = await link.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);

      const token = LINK;
      const tokenContract=link;
      const swaptoken = USDC; 
      const endDate = 1743743187;
      
      const amount = 1000000000000000000n;
      const feeRate = 0n;   //depends on the amount depositied
      const initFee = amount*feeRate/100n; 

      const unlockFee = 0n;

      const startFee = 0n;
      const affiliateFee = 0n;
      const slippage = 20n;
      const giftRewardRate = 0n
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,0],[5000000000, 0], [10000000000, 0]],3000,0)

      //Deposit

      const depositParams = {
        _addr: [token, contractOwner2.address, "0x0000000000000000000000000000000000000000"],
        _amount:amount,
        _otherFees: 700,
        _endDate: endDate,
        _target: 200,
        _features:[true, false, false],
        _uuid: "AAA-UUID",
        _skinId : 111,
      }

      // console.log(await tokenContract.balanceOf(coin_whale.address)) 


      let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParams);

      // console.log(await tokenContract.balanceOf(coin_whale.address)) 

      //---------------
      // console.log((await Faucet2.getSkinId(111))[1])
      // expect((await Faucet2.getLockedAsset(1))[11]).to.equal(coin_whale.address) //status is open
      expect((await Faucet2.getSkin(111))[0]).to.equal(coin_whale.address)

      const depositParams2 = {
        _addr: [ETH, contractOwner1.address, "0x0000000000000000000000000000000000000000"],
        _amount:200000000000000,
        _otherFees: 700,
        _endDate: endDate,
        _target: 200,
        _features:[true, false, false],
        _uuid: "AAA-UUID",
        _skinId : 111,
      }

      const amountETH = 300000000000000;
      let options={
        value: amountETH
       }
      let txDeposit2 = await Faucet1.deposit(depositParams2,options);
      // console.log(await Faucet2.getSkinId(111))

      // let data = await Faucet1.Quote(token,swaptoken,3000,amount) 
      // console.log(data)



      // //Time manipulations
      await time.increaseTo(endDate);
      // //------------------

      // //Claim
      // console.log(await tokenContract.balanceOf(contractOwner1.address))
      // console.log(await tokenContract.balanceOf(coin_whale.address)) 
 
      // const txClaim = await Faucet1.claim(1, swaptoken);
      // console.log(await tokenContract.balanceOf(contractOwner1.address)) 
      // console.log(await tokenContract.balanceOf(coin_whale.address)) 

    })
  })





  describe ("Deposit and Claim General Test",() => {
    it ('1. locked assets should be deposited and claimed_[true, false, false]', async () => {
      const{Faucet1, Faucet2, contractOwner1, gemChest,diamond, link,dai} = await loadFixture(deployTokenFixture);
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd2 = await Faucet2.addToken(USDT,1,pricefeed_usdt,8);
      let txAdd3 = await Faucet2.addToken(USDC,1, pricefeed_usdc,6);
      let txAdd4 = await Faucet2.addToken(WMATIC,1,pricefeed_wmatic, 18);
      let txAdd5 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);
      let txAdd6 = await Faucet2.addToken(WETH,1,pricefeed_weth, 18);

      let txApprove1 = await usdc.connect(coin_whale).approve(diamond.address, 12000000000000);
      let txApprove2 = await link.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
      let txApprove3 = await wmatic.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
      let txApprove4 = await weth.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);

      const token = LINK;
      const tokenContract=link;
      const swaptoken = USDC; 
      const swaptokenContract = usdc; 
      const endDate = 1743743187;
      
      const amount = 1000000000000000000n;
      const feeRate = 10n;   //depends on the amount depositied
      const initFee = amount*feeRate/100n; 

      const unlockFee = 0n;
      const unlockFeeAmount = amount*unlockFee/100n;
      const amountToSwap = amount-unlockFeeAmount

      const startFee = 0n;
      const affiliateFee = 0n;
      const slippage = 20n;
      const giftRewardRate = 10n
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)

      //getAmountOutMin
      let txExecuteGetAmountOutMin= await Faucet2.executeGetAmountOutMin(token, swaptoken, amountToSwap);
      let exchange_amount= await Faucet2.getAmountOutMin();
      console.log("getAmountOutMin",await  exchange_amount);
      //---------------


      //Deposit

      const depositParams = {
        _addr: [token, contractOwner2.address, contractOwner2.address],
        _amount:amount,
        _otherFees: 0,
        _endDate: endDate,
        _target: 200,
        _features:[true, false, false],
        _uuid: "AAA-UUID",
        _skinId : 111,
      }

      let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParams);
      // ---------------
      expect(await swaptokenContract.balanceOf(diamond.address)).to.equal(0);
      expect(await tokenContract.balanceOf(diamond.address)).to.equal(amount+initFee); 
      expect(await gemChest.ownerOf(1)).to.equal(contractOwner2.address);
      expect((await Faucet2.getToken(token))[2]).to.equal(initFee);
      expect((await Faucet2.getLockedAsset(1))[10]).to.equal(2) //status is open

      //Time manipulations
      await time.increaseTo(endDate);
      //------------------

      //Claim
      const txClaim = await Faucet1.claim(1, swaptoken);
      //------------------

      await expect(gemChest.ownerOf(1)).to.be.reverted;
      expect(await tokenContract.balanceOf(diamond.address)).to.equal(initFee + unlockFeeAmount);
      expect( (await Faucet2.getToken(token))[2]).to.equal(initFee + unlockFeeAmount);
      expect((await Faucet2.getLockedAsset(1))[10]).to.equal(1) //status is closed

      try {
        expect(await swaptokenContract.balanceOf(contractOwner2.address)).to.gte(exchange_amount);
        console.log("Swap is done")
      } catch {
        expect(await tokenContract.balanceOf(contractOwner2.address)).to.gte(amount-unlockFeeAmount);
        console.log("Swap is not done")
      }
    })


    it ('2. locked assets should be deposited and claimed_[true, false, true]', async () => {
      const{Faucet1, Faucet2, contractOwner1,gemChest,diamond, link,dai} = await loadFixture(deployTokenFixture);
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd2 = await Faucet2.addToken(USDT,1,pricefeed_usdt,8);
      let txAdd3 = await Faucet2.addToken(USDC,1, pricefeed_usdc,6);
      let txAdd4 = await Faucet2.addToken(WMATIC,1,pricefeed_wmatic, 18);
      let txAdd5 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);
      let txAdd6 = await Faucet2.addToken(WETH,1,pricefeed_weth, 18);

      let txApprove1 = await usdc.connect(coin_whale).approve(diamond.address, 12000000000000);
      let txApprove2 = await link.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
      let txApprove3 = await wmatic.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
      let txApprove4 = await weth.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);

      const token = WETH;
      const tokenContract=weth;
      const swaptoken = USDC; 
      const swaptokenContract = usdc; 
      const endDate = 1743743187;
      
      const amount = 1000000000000000000n;
      feeRate = 3n;   //depends on the amount depositied
      const initFee = amount*feeRate/100n; 

      const unlockFee = 0n;
      const unlockFeeAmount = amount*unlockFee/100n;
      const amountToSwap = amount-unlockFeeAmount
      // console.log("amountToSwap", amountToSwap)
      
      const startFee = 0n;
      const affiliateFee = 0n;
      const slippage = 20n;
      const giftRewardRate = 10n
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)
      
      //getAmountOutMin
      let txExecuteGetAmountOutMin= await Faucet2.executeGetAmountOutMin(token, swaptoken, amountToSwap);
      let exchange_amount= await Faucet2.getAmountOutMin();
      console.log("getAmountOutMingetAmountOutMingetAmountOutMin",await  exchange_amount);
      //---------------

      //Deposit
      const depositParams = {
        _addr: [token, contractOwner2.address, contractOwner2.address],
        _amount:amount,
        _otherFees: 0,
        _endDate: endDate,
        _target: 200,
        _features:[true, false, true],
        _uuid: "AAA-UUID",
        _skinId : 111,
      }
      let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParams);
      
      //---------------

      let TxViewLockAsset= await Faucet2.getLockedAsset(1);
      // console.log("TxViewLockAsset", TxViewLockAsset);
      
      expect(await swaptokenContract.balanceOf(diamond.address)).to.equal(0);
      expect(await tokenContract.balanceOf(diamond.address)).to.equal(amount+initFee); 
      expect(await gemChest.ownerOf(1)).to.equal(contractOwner2.address);
      expect((await Faucet2.getToken(token))[2]).to.equal(initFee);
      expect((await Faucet2.getLockedAsset(1))[10]).to.equal(2) //status is open

      //Time manipulations
      await time.increaseTo(endDate);
      //------------------

      //Claim
      const txClaim = await Faucet1.claim(1, swaptoken);
      //------------------

      //GAS
      const gasPrice = await ethers.provider.getGasPrice();
      // console.log("PPPPPPPPP", gasPrice)
      const receipt = await txClaim.wait()
      const gasUsed = receipt.gasUsed;
      const gasFee = gasUsed.mul(gasPrice);
      // console.log("gasUsed,gasPrice, gasFee",gasUsed,gasPrice, gasFee)
      //-------------------

      await expect(gemChest.ownerOf(1)).to.be.reverted;
      expect(await tokenContract.balanceOf(diamond.address)).to.equal(initFee + unlockFeeAmount); 
      expect( (await Faucet2.getToken(token))[2]).to.equal(initFee + unlockFeeAmount);
      expect((await Faucet2.getLockedAsset(1))[10]).to.equal(1) //status is closed

      expect(await swaptokenContract.balanceOf(contractOwner2.address)).to.equal(exchange_amount);
      console.log("Swap is done")

    })

    //333333333333333333333333

    it ('3. locked assets should be deposited and claimed_[true, true, false]', async () => {
      //Here price manipulation should be done
      //Check to change the price back
      
      const{Faucet1, Faucet2, contractOwner1,gemChest,diamond, link,dai} = await loadFixture(deployTokenFixture);
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd2 = await Faucet2.addToken(USDT,1,pricefeed_usdt,8);
      let txAdd3 = await Faucet2.addToken(USDC,1, pricefeed_usdc,6);
      let txAdd4 = await Faucet2.addToken(WMATIC,1,pricefeed_wmatic, 18);
      let txAdd5 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);
      let txAdd6 = await Faucet2.addToken(WETH,1,pricefeed_weth, 18);

      let txApprove1 = await usdc.connect(coin_whale).approve(diamond.address, 12000000000000);
      let txApprove2 = await link.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
      let txApprove3 = await wmatic.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
      let txApprove4 = await weth.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);

      const token = WETH;
      const tokenContract=weth;
      const swaptoken = USDT; 
      const swaptokenContract = usdt; 
      const endDate = 1743743187;
      
      const amount = 1000000000000000000n;
      feeRate = 3n;   //depends on the amount depositied
      const initFee = amount*feeRate/100n; 

      const unlockFee = 0n;
      const unlockFeeAmount = amount*unlockFee/100n;
      const amountToSwap = amount-unlockFeeAmount
      console.log("amountToSwap", amountToSwap);

      const giftRewardRate = 10n
      const giftRewardAmount = (amountToSwap*giftRewardRate)/100n;

      const startFee = 0n;
      const affiliateFee = 0n;
      const slippage = 20n;
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)

      //getAmountOutMin
      let txExecuteGetAmountOutMin= await Faucet2.executeGetAmountOutMin(token, swaptoken, amountToSwap);
      let exchange_amount= await Faucet2.getAmountOutMin();
      console.log("getAmountOutMin",await  exchange_amount);
      //---------------

      //Deposit

      //Deposit
      const depositParams = {
        _addr: [token, contractOwner2.address, contractOwner2.address],
        _amount:amount,
        _otherFees: 0,
        _endDate: endDate,
        _target: 200,
        _features:[true, true, false],
        _uuid: "AAA-UUID",
        _skinId : 111,
      }
      let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParams);
      //---------------

      const coinWhaleTokenBalance =await tokenContract.balanceOf(coin_whale.address);

      let TxViewLockAsset= await Faucet2.getLockedAsset(1);
      console.log("TxViewLockAsset", TxViewLockAsset);
      
      expect(await swaptokenContract.balanceOf(diamond.address)).to.equal(0);
      expect(await tokenContract.balanceOf(diamond.address)).to.equal(amount+initFee); 
      expect(await gemChest.ownerOf(1)).to.equal(contractOwner2.address);
      expect((await Faucet2.getToken(token))[2]).to.equal(initFee);
      expect((await Faucet2.getLockedAsset(1))[10]).to.equal(2) //status is open

      //Time manipulations
      // await time.increaseTo(endDate);    //Not relevant here, shold price event be fired
      //------------------

      //Claim
      const txClaim = await Faucet1.claim(1, swaptoken);
      //------------------
      
      await expect(gemChest.ownerOf(1)).to.be.reverted;
      expect(await tokenContract.balanceOf(diamond.address)).to.equal(initFee + unlockFeeAmount); 
      expect( (await Faucet2.getToken(token))[2]).to.equal(initFee + unlockFeeAmount);
      expect((await Faucet2.getLockedAsset(1))[10]).to.equal(1) //status is closed
      expect(await tokenContract.balanceOf(coin_whale.address)).to.equal(coinWhaleTokenBalance.add(giftRewardAmount));

      try {
        expect(await swaptokenContract.balanceOf(contractOwner2.address)).to.equal(exchange_amount);
        console.log("Swap is done")
      } catch {
        expect(await tokenContract.balanceOf(contractOwner2.address)).to.equal(amount-unlockFeeAmount-giftRewardAmount);
        console.log("Swap is not done")
      }
    })

    //4444444444444444444444444

    it ('4. locked assets should be deposited and claimed_[true, true, true]', async () => {
      //Here price manipulation should be done
      //Check to change the price back
      
      const{Faucet1, Faucet2, contractOwner1,gemChest,diamond, link,dai} = await loadFixture(deployTokenFixture);
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd2 = await Faucet2.addToken(USDT,1,pricefeed_usdt,6);
      let txAdd3 = await Faucet2.addToken(USDC,1, pricefeed_usdc,6);
      let txAdd4 = await Faucet2.addToken(WMATIC,1,pricefeed_wmatic, 18);
      let txAdd5 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);
      let txAdd6 = await Faucet2.addToken(WETH,1,pricefeed_weth, 18);

      let txApprove1 = await usdc.connect(coin_whale).approve(diamond.address, 12000000000000);
      let txApprove2 = await link.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
      let txApprove3 = await wmatic.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
      let txApprove4 = await weth.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);

      const token = WETH;
      const tokenContract=weth;
      const swaptoken = USDC; 
      const swaptokenContract = usdc; 
      const endDate = 1743743187;
      
      const amount = 10000000000000000000n;
      feeRate = 3n;   //depends on the amount depositied
      const initFee = amount*feeRate/100n; 

      const unlockFee = 0n;
      const unlockFeeAmount = amount*unlockFee/100n;
      const amountToSwap = amount-unlockFeeAmount

      const giftRewardRate = 10n
      const giftRewardAmount = (amountToSwap*giftRewardRate)/100n;

      const startFee = 0n;
      const affiliateFee = 0n;
      const slippage = 20n;
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)  

      let txExecuteGetAmountOutMin= await Faucet2.executeGetAmountOutMin(token, swaptoken, amount-giftRewardAmount);
      let exchange_amount = await Faucet2.getAmountOutMin();
      console.log("getAmountOutMin",await  exchange_amount);

      // let data = await Faucet1.Quote(token,swaptoken,3000,amount-giftRewardAmount) 
      // console.log(data)
      //--------------- 

      //Deposit
      const depositParams = {
        _addr: [token, contractOwner2.address, contractOwner2.address],
        _amount:amount,
        _otherFees: 0,
        _endDate: endDate,
        _target: 200,
        _features:[true, true, true],
        _uuid: "AAA-UUID",
        _skinId : 111,
      }
      let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParams);
      //---------------


      const coinWhaleSwapTokenBalance =await swaptokenContract.balanceOf(coin_whale.address);

      let TxViewLockAsset= await Faucet2.getLockedAsset(1);
      console.log("TxViewLockAsset", TxViewLockAsset);                    ////////////////////////////////////////////////////////////////////////////////////////
      
      expect(await swaptokenContract.balanceOf(diamond.address)).to.equal(0);
      expect(await swaptokenContract.balanceOf(contractOwner2.address)).to.equal(0);
      expect(await tokenContract.balanceOf(diamond.address)).to.equal(amount+initFee); 
      expect(await gemChest.ownerOf(1)).to.equal(contractOwner2.address);
      expect((await Faucet2.getToken(token))[2]).to.equal(initFee);
      expect((await Faucet2.getLockedAsset(1))[10]).to.equal(2) //status is open
      
      //Time manipulations
      // await time.increaseTo(endDate);    //Not relevant here, shold price event be fired
      //------------------
      
      //Claim
      const txClaim = await Faucet1.claim(1, swaptoken);
            
      //------------------
      
      await expect(gemChest.ownerOf(1)).to.be.reverted;
      expect(await tokenContract.balanceOf(diamond.address)).to.equal(initFee + unlockFeeAmount); 
      expect( (await Faucet2.getToken(token))[2]).to.equal(initFee + unlockFeeAmount);
      expect((await Faucet2.getLockedAsset(1))[10]).to.equal(1) //status is closed


      //WARNING! As 2 swap are executed, the exchange_amount changes causing wrong output for the test
        // expect(await swaptokenContract.balanceOf(contractOwner2.address)).to.equal(exchange_amount);
   
    })


it ('5.1 locked assets should be deposited and claimed_[false, true, false] submitBen before claim', async () => {
  //Here price manipulation should be done
  //Check to change the price back
  
  const{Faucet1, Faucet2, contractOwner1,gemChest,diamond, link,dai} = await loadFixture(deployTokenFixture);
  let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
  let txAdd2 = await Faucet2.addToken(USDT,1,pricefeed_usdt,6);
  let txAdd3 = await Faucet2.addToken(USDC,1, pricefeed_usdc,6);
  let txAdd4 = await Faucet2.addToken(WMATIC,1,pricefeed_wmatic, 18);
  let txAdd5 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);
  let txAdd6 = await Faucet2.addToken(WETH,1,pricefeed_weth, 18);

  let txApprove1 = await usdc.connect(coin_whale).approve(diamond.address, 12000000000000);
  let txApprove2 = await link.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
  let txApprove3 = await wmatic.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
  let txApprove4 = await weth.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);

  const token = WETH;
  const tokenContract=weth;
  const swaptoken = USDC;
  const swaptokenContract = usdc;
  const endDate = 1743743187;
  
  const amount = 1000000000000000000n;
  feeRate = 3n;   //depends on the amount depositied
  const initFee = amount*feeRate/100n; 

  const unlockFee = 0n;
  const unlockFeeAmount = amount*unlockFee/100n;
  const amountToSwap = amount-unlockFeeAmount
  console.log("amountToSwap", amountToSwap);

  const giftRewardRate = 10n
  const giftRewardAmount = (amountToSwap*giftRewardRate)/100n;

  const startFee = 0n;
  const affiliateFee = 0n;
  const slippage = 20n;
  
  let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)

  let txExecuteGetAmountOutMin= await Faucet2.executeGetAmountOutMin(token, swaptoken, amount-giftRewardAmount);
  let exchange_amount= await Faucet2.getAmountOutMin();
  console.log("getAmountOutMin",await  exchange_amount);
  //--------------- 


  //Deposit
  const depositParams = {
    _addr: [token, contractOwner2.address, contractOwner2.address],
    _amount:amount,
    _otherFees: 0,
    _endDate: endDate,
    _target: 200,
    _features:[false, true, false],
    _uuid: "AAA-UUID",
    _skinId : 111,
  }
  let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParams);
  
  //---------------

  const coinWhaleTokenBalance =await tokenContract.balanceOf(coin_whale.address);
  const contractOwner2TokenBalance = await tokenContract.balanceOf(contractOwner2.address);

  expect(await swaptokenContract.balanceOf(diamond.address)).to.equal(0);
  expect(await tokenContract.balanceOf(diamond.address)).to.equal(amount+initFee); 
  expect(await gemChest.ownerOf(1)).to.equal(diamond.address);
  expect((await Faucet2.getToken(token))[2]).to.equal(initFee);
  expect((await Faucet2.getLockedAsset(1))[10]).to.equal(2) //status is open
  await expect(Faucet2.connect(coin_whale).submitBeneficiary(1, "Helloooo", "0xeeda6f3ed6ecdea92b1589de40021769f2e3464dc825907bdce5065f10f90e2868fe6950e34cbc80025c981cfeab715859828566f6369cded411a825f0e266c21c", DAI, contractOwner1.address)).to.be.revertedWith('false signature')

  //Time manipulations
  // await time.increaseTo(endDate);    //Not relevant here, shold price event be fired
  //------------------
  
  const tx = Faucet2.connect(contractOwner1).submitBeneficiary(1, "Helloooo", "0xeeda6f3ed6ecdea92b1589de40021769f2e3464dc825907bdce5065f10f90e2868fe6950e34cbc80025c981cfeab715859828566f6369cded411a825f0e266c21c", USDC, contractOwner1.address)
  
  expect(await gemChest.ownerOf(1)).to.equal(contractOwner1.address);
  expect((await Faucet2.getLockedAsset(1))[1]).to.equal(contractOwner1.address)

  //Claim
  const txClaim = await Faucet1.claim(1, swaptoken);
  //------------------

  await expect(gemChest.ownerOf(1)).to.be.reverted;
  await expect(Faucet2.connect(coin_whale).submitBeneficiary(1, "Helloooo", "0xeeda6f3ed6ecdea92b1589de40021769f2e3464dc825907bdce5065f10f90e2868fe6950e34cbc80025c981cfeab715859828566f6369cded411a825f0e266c21c", DAI, contractOwner1.address)).to.be.revertedWith('asset isOwned');
  expect(await tokenContract.balanceOf(diamond.address)).to.equal(initFee); 
  expect((await Faucet2.getToken(token))[2]).to.equal(initFee + unlockFeeAmount);
  expect((await Faucet2.getLockedAsset(1))[10]).to.equal(1) //status is closed
  expect(await tokenContract.balanceOf(coin_whale.address)).to.equal(coinWhaleTokenBalance.add(giftRewardAmount));
  expect(await tokenContract.balanceOf(contractOwner2.address)).to.equal(contractOwner2TokenBalance);

  expect(await  tokenContract.balanceOf(contractOwner1.address)).to.equal(amountToSwap-giftRewardAmount);

  //----------------
  expect(await  swaptokenContract.balanceOf(contractOwner1.address)).to.equal(0); 

})

//5.2

it ('5.2 locked assets should be deposited and claimed_[false, true, false] submitBen after claim', async () => {
  //Here price manipulation should be done
  //Check to change the price back
  
  const{Faucet1, Faucet2, contractOwner1,gemChest,diamond, link,dai} = await loadFixture(deployTokenFixture);
  let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
  let txAdd2 = await Faucet2.addToken(USDT,1,pricefeed_usdt,6);
  let txAdd3 = await Faucet2.addToken(USDC,1, pricefeed_usdc,6);
  let txAdd4 = await Faucet2.addToken(WMATIC,1,pricefeed_wmatic, 18);
  let txAdd5 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);
  let txAdd6 = await Faucet2.addToken(WETH,1,pricefeed_weth, 18);

  let txApprove1 = await usdc.connect(coin_whale).approve(diamond.address, 12000000000000);
  let txApprove2 = await link.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
  let txApprove3 = await wmatic.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
  let txApprove4 = await weth.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);

  const token = WETH;
  const tokenContract=weth;
  const swaptoken = USDC;
  const swaptokenContract = usdc;
  const endDate = 1743743187;
  
  const amount = 1000000000000000000n;
  feeRate = 3n;   //depends on the amount depositied
  const initFee = amount*feeRate/100n; 

  const unlockFee = 0n;
  const unlockFeeAmount = amount*unlockFee/100n;
  const amountToSwap = amount-unlockFeeAmount
  console.log("amountToSwap", amountToSwap);

  const giftRewardRate = 10n
  const giftRewardAmount = (amountToSwap*giftRewardRate)/100n;

  const startFee = 0n;
  const affiliateFee = 0n;
  const slippage = 20n;
  
  let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0) 

  let txExecuteGetAmountOutMin= await Faucet2.executeGetAmountOutMin(token, swaptoken, amount-giftRewardAmount);
  let exchange_amount= await Faucet2.getAmountOutMin();
  console.log("getAmountOutMin",await  exchange_amount);
  //--------------- 

  //Deposit
  const depositParams = {
    _addr: [token, contractOwner2.address, contractOwner2.address],
    _amount:amount,
    _otherFees: 0,
    _endDate: endDate,
    _target: 200,
    _features:[false, true, false],
    _uuid: "AAA-UUID",
    _skinId : 111,
  }
  let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParams);
  
  //---------------

  const coinWhaleTokenBalance =await tokenContract.balanceOf(coin_whale.address);
  const contractOwner2TokenBalance = await tokenContract.balanceOf(contractOwner2.address);

  let TxViewLockAsset= await Faucet2.getLockedAsset(1);
  console.log("TxViewLockAsset", TxViewLockAsset);

  expect(await swaptokenContract.balanceOf(diamond.address)).to.equal(0);
  expect(await tokenContract.balanceOf(diamond.address)).to.equal(amount+initFee); 
  expect(await gemChest.ownerOf(1)).to.equal(diamond.address);
  expect((await Faucet2.getToken(token))[2]).to.equal(initFee);
  expect((await Faucet2.getLockedAsset(1))[10]).to.equal(2) //status is open
  
  //Time manipulations
  // await time.increaseTo(endDate);    //Not relevant here, shold price event be fired
  //------------------
  
  //Claim
  const txClaim = await Faucet1.claim(1, swaptoken);
  //------------------

  // await expect(gemChest.ownerOf(1)).to.be.reverted;
  expect(await tokenContract.balanceOf(diamond.address)).to.equal(initFee + amountToSwap - giftRewardAmount); 
  expect((await Faucet2.getToken(token))[2]).to.equal(initFee + unlockFeeAmount);
  expect((await Faucet2.getLockedAsset(1))[10]).to.equal(1) //status is closed
  expect(await tokenContract.balanceOf(coin_whale.address)).to.equal(coinWhaleTokenBalance.add(giftRewardAmount));
  expect(await tokenContract.balanceOf(contractOwner2.address)).to.equal(contractOwner2TokenBalance);

  expect(await  tokenContract.balanceOf(contractOwner1.address)).to.equal(0);
  await expect(Faucet2.connect(coin_whale).submitBeneficiary(1, "Helloooo", "0xeeda6f3ed6ecdea92b1589de40021769f2e3464dc825907bdce5065f10f90e2868fe6950e34cbc80025c981cfeab715859828566f6369cded411a825f0e266c21c", DAI, contractOwner1.address)).to.be.revertedWith('false signature')

  const tx = Faucet2.connect(contractOwner1).submitBeneficiary(1, "Helloooo", "0xeeda6f3ed6ecdea92b1589de40021769f2e3464dc825907bdce5065f10f90e2868fe6950e34cbc80025c981cfeab715859828566f6369cded411a825f0e266c21c", USDC, contractOwner1.address)
  //----------------
  expect(await tokenContract.balanceOf(diamond.address)).to.equal(initFee); 
  expect(await  tokenContract.balanceOf(contractOwner1.address)).to.equal(amountToSwap-giftRewardAmount);
  expect(await  swaptokenContract.balanceOf(contractOwner1.address)).to.equal(0); 

})


it ('5.3 locked assets should be deposited and claimed_[false, true, false]_submitBen after claim_ETHER', async () => {
  //Here price manipulation should be done
  //Check to change the price back
  
  const{Faucet1, Faucet2, contractOwner1,gemChest,diamond, link,dai} = await loadFixture(deployTokenFixture);
  let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
  let txAdd2 = await Faucet2.addToken(USDT,1,pricefeed_usdt,6);
  let txAdd3 = await Faucet2.addToken(USDC,1, pricefeed_usdc,6);
  let txAdd4 = await Faucet2.addToken(WMATIC,1,pricefeed_wmatic, 18);
  let txAdd5 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);
  let txAdd6 = await Faucet2.addToken(WETH,1,pricefeed_weth, 18);
  let txAdd7 = await Faucet2.addToken(ETH,1,pricefeed_weth, 18);

  let txApprove1 = await usdc.connect(coin_whale).approve(diamond.address, 12000000000000);
  let txApprove2 = await link.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
  let txApprove3 = await wmatic.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
  let txApprove4 = await weth.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);

  const token = ETH;
  const tokenContract = weth;
  const swaptoken = USDC;
  const swaptokenContract = usdc;
  const endDate = 1743743187;

  const amount = 1000000000000000000n;
  feeRate = 3n;   //depends on the amount depositied
  const initFee = amount*feeRate/100n; 

  let options={
    value: amount+initFee
   }

  const unlockFee = 0n;
  const unlockFeeAmount = amount*unlockFee/100n;
  const amountToSwap = amount-unlockFeeAmount
  console.log("amountToSwap", amountToSwap);

  const giftRewardRate = 10n
  const giftRewardAmount = (amountToSwap*giftRewardRate)/100n;

  
  const c2BalanceBeforeDeposit = await ethers.provider.getBalance(contractOwner2.address)
  
  const startFee = 0n;
  const affiliateFeeRate = 10n;
  const affiliateFee = initFee*affiliateFeeRate/100n;
  const slippage = 20n;
  
  let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFeeRate, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0) 

  //Get swapped amount
  let txExecuteGetAmountOutMin= await Faucet2.executeGetAmountOutMin(token, swaptoken, amount-giftRewardAmount);
  let exchange_amount= await Faucet2.getAmountOutMin();
  console.log("exchange_amount",await  exchange_amount);
  //--------------- 

  //Deposit
  const depositParams = {
    _addr: [token, contractOwner2.address, contractOwner2.address],
    _amount:amount,
    _otherFees: 0,
    _endDate: endDate,
    _target: 200,
    _features:[false, true, false],
    _uuid: "AAA-UUID",
    _skinId : 111,
  }
  let txDeposit1 = await Faucet1.connect(contractOwner3).deposit(depositParams,options);
  
  //---------------


  let TxViewLockAsset= await Faucet2.getLockedAsset(1);
  console.log("TxViewLockAsset", TxViewLockAsset);

  const diaomondBalanceBef = await ethers.provider.getBalance(diamond.address)
  const c1BalanceBeforeClaim = await ethers.provider.getBalance(contractOwner1.address)

  expect(await ethers.provider.getBalance(contractOwner2.address)).be.equal(c2BalanceBeforeDeposit.add(affiliateFee));
  expect(await swaptokenContract.balanceOf(contractOwner2.address)).to.equal(0); 
  expect(await gemChest.ownerOf(1)).to.equal(diamond.address);
  expect((await Faucet2.getToken(token))[2]).to.equal(initFee-affiliateFee);
  expect((await Faucet2.getLockedAsset(1))[10]).to.equal(2) //status is open
  
  //Time manipulations
  // await time.increaseTo(endDate);    //Not relevant here, shold price event be fired
  //------------------
  
  //Claim
  const txClaim = await Faucet1.claim(1, swaptoken);
  //------------------
  const c1BalBeforeSubmitBeneficiary = await ethers.provider.getBalance(contractOwner1.address)
  
  expect(await ethers.provider.getBalance(diamond.address)).to.equal(diaomondBalanceBef.sub(giftRewardAmount))
  expect(await swaptokenContract.balanceOf(contractOwner1.address)).to.equal(0);
  expect(await swaptokenContract.balanceOf(contractOwner2.address)).to.equal(0);
  await expect(gemChest.ownerOf(1)).to.be.reverted;
  expect((await Faucet2.getToken(token))[2]).to.equal(initFee-affiliateFee);
  expect((await Faucet2.getLockedAsset(1))[10]).to.equal(1) //status is closed
 
  const tx =await Faucet2.connect(contractOwner3).submitBeneficiary(1, "Hello", "0x7e130ea84cc85682ae4b16df92bb77b5541bf1ea16d559f7be1387582365611d299004a284c71d1a918f7a6996b34df4a7a11043450d4da9b0ad0655f7954ed91b", USDC, contractOwner1.address)
  
  expect(await  ethers.provider.getBalance(contractOwner1.address)).to.equal(c1BalBeforeSubmitBeneficiary.add(amountToSwap).sub(giftRewardAmount));
  expect(await ethers.provider.getBalance(diamond.address)).to.equal(initFee-affiliateFee);
})

// 6

it ('6.1 locked assets should be deposited and claimed_[false, true, true] submitBen before claim', async () => {
  //Here price manipulation should be done
  //Check to change the price back
  
  const{Faucet1, Faucet2, contractOwner1,gemChest,diamond, link,dai} = await loadFixture(deployTokenFixture);
  let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
  let txAdd2 = await Faucet2.addToken(USDT,1,pricefeed_usdt,6);
  let txAdd3 = await Faucet2.addToken(USDC,1, pricefeed_usdc,6);
  let txAdd4 = await Faucet2.addToken(WMATIC,1,pricefeed_wmatic, 18);
  let txAdd5 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);
  let txAdd6 = await Faucet2.addToken(WETH,1,pricefeed_weth, 18);

  let txApprove1 = await usdc.connect(coin_whale).approve(diamond.address, 12000000000000);
  let txApprove2 = await link.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
  let txApprove3 = await wmatic.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
  let txApprove4 = await weth.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);

  const token = WETH;
  const tokenContract=weth;
  const swaptoken = USDC;
  const swaptokenContract = usdc;
  const endDate = 1743743187;
  
  const amount = 10000000000000000000n;
  feeRate = 3n;   //depends on the amount depositied
  const initFee = amount*feeRate/100n; 

  const unlockFee = 0n;
  const unlockFeeAmount = amount*unlockFee/100n;
  const amountToSwap = amount-unlockFeeAmount;
  console.log("amountToSwap", amountToSwap);

  const giftRewardRate = 10n;
  const giftRewardAmount = (amountToSwap*giftRewardRate)/100n;

  const startFee = 0n;
  const affiliateFee = 0n;
  const slippage = 20n;
 
  
  let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)
  
  // let txExecuteGetAmountOutMinForGift= await Faucet2.executeGetAmountOutMin(token, swaptoken, giftRewardAmount);
  // let gift_exchange_amount= await Faucet2.getAmountOutMin();
  // console.log("gift_exchange_amount",await  gift_exchange_amount);

  let txExecuteGetAmountOutMin= await Faucet2.executeGetAmountOutMin(token, swaptoken, amount-giftRewardAmount);
  let exchange_amount= await Faucet2.getAmountOutMin();
  console.log("exchange_amount",await  exchange_amount);
  //--------------- 

    //Deposit
    const depositParams = {
      _addr: [token, contractOwner2.address, contractOwner2.address],
      _amount:amount,
      _otherFees: 0,
      _endDate: endDate,
      _target: 200,
      _features:[false, true, true],
      _uuid: "AAA-UUID",
      _skinId : 111,
    }
    let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParams);
    
    //---------------

  const coinWhaleSwaptokenContractBalance =await swaptokenContract.balanceOf(coin_whale.address);
  const contractOwner2TokenBalance = await tokenContract.balanceOf(contractOwner2.address);

  let TxViewLockAsset= await Faucet2.getLockedAsset(1);
  console.log("TxViewLockAsset", TxViewLockAsset);

  expect(await swaptokenContract.balanceOf(diamond.address)).to.equal(0);
  expect(await tokenContract.balanceOf(diamond.address)).to.equal(amount+initFee); 
  expect(await gemChest.ownerOf(1)).to.equal(diamond.address);
  expect((await Faucet2.getToken(token))[2]).to.equal(initFee);
  expect((await Faucet2.getLockedAsset(1))[9][0]).to.equal(false) //isOwned is false
  expect((await Faucet2.getLockedAsset(1))[10]).to.equal(2) //status is open
  
  //Time manipulations
  // await time.increaseTo(endDate);    //Not relevant here, shold price event be fired
  //------------------

  const txSubmit =await Faucet2.connect(contractOwner3).submitBeneficiary(1, "Hello", "0x7e130ea84cc85682ae4b16df92bb77b5541bf1ea16d559f7be1387582365611d299004a284c71d1a918f7a6996b34df4a7a11043450d4da9b0ad0655f7954ed91b", USDC, contractOwner1.address)

  expect((await Faucet2.getLockedAsset(1))[9][0]).to.equal(true) //isOwned is false
  expect(await gemChest.ownerOf(1)).to.equal(contractOwner1.address);
  expect(await swaptokenContract.balanceOf(contractOwner1.address)).to.equal(0);

  console.log("_", await swaptokenContract.balanceOf(contractOwner1.address));

  //-----------------Claim
  const txClaim = await Faucet1.claim(1, swaptoken);
  //------------------

    console.log("_", await swaptokenContract.balanceOf(contractOwner1.address));


  let txExecuteGetAmountOutMinAfterClaim= await Faucet2.executeGetAmountOutMin(token, swaptoken, amount-giftRewardAmount);
  let exchange_amount_after_claim= await Faucet2.getAmountOutMin();
  console.log("exchange_amount_after_claim",await exchange_amount_after_claim);

  await expect(gemChest.ownerOf(1)).to.be.reverted;
  expect(await tokenContract.balanceOf(diamond.address)).to.equal(initFee); 
  // expect(await swaptokenContract.balanceOf(diamond.address)).to.equal(exchange_amount); //Nor equal as pool changes
  expect((await Faucet2.getToken(token))[2]).to.equal(initFee + unlockFeeAmount);
  expect((await Faucet2.getLockedAsset(1))[10]).to.equal(1) //status is closed
  // expect(await swaptokenContract.balanceOf(coin_whale.address)).to.equal(coinWhaleSwaptokenContractBalance.add(gift_exchange_amount));
  expect(await tokenContract.balanceOf(contractOwner2.address)).to.equal(contractOwner2TokenBalance);

  await expect(Faucet2.connect(coin_whale).submitBeneficiary(1, "Helloooo", "0xeeda6f3ed6ecdea92b1589de40021769f2e3464dc825907bdce5065f10f90e2868fe6950e34cbc80025c981cfeab715859828566f6369cded411a825f0e266c21c", USDC, contractOwner1.address)).to.be.revertedWith('asset isOwned');
  await expect(Faucet2.connect(contractOwner2).submitBeneficiary(1, "Hello", "0xeeda6f3ed6ecdea92b1589de40021769f2e3464dc825907bdce5065f10f90e2868fe6950e34cbc80025c981cfeab715859828566f6369cded411a825f0e266c21c", USDC, contractOwner1.address)).to.be.reverted;
  //----------------
  expect(await tokenContract.balanceOf(diamond.address)).to.equal(initFee); 
  expect(await  tokenContract.balanceOf(contractOwner1.address)).to.equal(0);
  // expect(await  swaptokenContract.balanceOf(contractOwner1.address)).to.equal(exchange_amount_after_claim); 

})

it ('6.2 locked assets should be deposited and claimed_[false, true, true] submitBen after claim', async () => {
  //Here price manipulation should be done
  //Check to change the price back
  
  const{Faucet1, Faucet2, contractOwner1,gemChest,diamond, link,dai} = await loadFixture(deployTokenFixture);
  let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
  let txAdd2 = await Faucet2.addToken(USDT,1,pricefeed_usdt,6);
  let txAdd3 = await Faucet2.addToken(USDC,1, pricefeed_usdc,6);
  let txAdd4 = await Faucet2.addToken(WMATIC,1,pricefeed_wmatic, 18);
  let txAdd5 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);
  let txAdd6 = await Faucet2.addToken(WETH,1,pricefeed_weth, 18);

  let txApprove1 = await usdc.connect(coin_whale).approve(diamond.address, 12000000000000);
  let txApprove2 = await link.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
  let txApprove3 = await wmatic.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);
  let txApprove4 = await weth.connect(coin_whale).approve(diamond.address, 10000000000000000000000n);

  const token = WETH;
  const tokenContract=weth;
  const swaptoken = USDC;
  const swaptokenContract = usdc;
  const endDate = 1743743187;
  
  const amount = 1000000000000000000n;
  feeRate = 3n;   //depends on the amount depositied
  const initFee = amount*feeRate/100n; 

  const unlockFee = 0n;
  const unlockFeeAmount = amount*unlockFee/100n;
  const amountToSwap = amount-unlockFeeAmount
  console.log("amountToSwap", amountToSwap);

  const giftRewardRate = 10n
  const giftRewardAmount = (amountToSwap*giftRewardRate)/100n;

  const startFee = 0n;
  const affiliateFee = 0n;
  const slippage = 20n;
  
  let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)

  let txExecuteGetAmountOutMinForGift= await Faucet2.executeGetAmountOutMin(token, swaptoken, giftRewardAmount);
  let gift_exchange_amount= await Faucet2.getAmountOutMin();
  console.log("gift_exchange_amount",await  gift_exchange_amount)

  let txExecuteGetAmountOutMin= await Faucet2.executeGetAmountOutMin(token, swaptoken, amount-giftRewardAmount);
  let exchange_amount= await Faucet2.getAmountOutMin();
  console.log("getAmountOutMin",await  exchange_amount);
  //--------------- 


  //Deposit
  const depositParams = {
    _addr: [token, contractOwner2.address, contractOwner2.address],
    _amount:amount,
    _otherFees: 0,
    _endDate: endDate,
    _target: 200,
    _features:[false, true, true],
    _uuid: "AAA-UUID",
    _skinId : 111,
  }
  let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParams);
  
  //---------------


  const coinWhaleSwaptokenContractBalance =await swaptokenContract.balanceOf(coin_whale.address);
  const contractOwner2TokenBalance = await tokenContract.balanceOf(contractOwner2.address);

  let TxViewLockAsset= await Faucet2.getLockedAsset(1);
  console.log("TxViewLockAsset", TxViewLockAsset);

  expect(await swaptokenContract.balanceOf(diamond.address)).to.equal(0);
  expect(await tokenContract.balanceOf(diamond.address)).to.equal(amount+initFee); 
  expect(await gemChest.ownerOf(1)).to.equal(diamond.address);
  expect((await Faucet2.getToken(token))[2]).to.equal(initFee);
  expect((await Faucet2.getLockedAsset(1))[10]).to.equal(2) //status is open
  
  //Time manipulations
  // await time.increaseTo(endDate);    //Not relevant here, shold price event be fired
  //------------------
  
  //Claim
  const txClaim = await Faucet1.claim(1, swaptoken);
  //------------------

  let txExecuteGetAmountOutMinAfterClaim= await Faucet2.executeGetAmountOutMin(token, swaptoken, amount-giftRewardAmount);
  let exchange_amount_after_claim= await Faucet2.getAmountOutMin();
  console.log("getAmountOutMin",await  exchange_amount_after_claim);

// console.log('//////////////', await swaptokenContract.balanceOf(diamond.address))
  // await expect(gemChest.ownerOf(1)).to.be.reverted;
  expect(await tokenContract.balanceOf(diamond.address)).to.equal(initFee); 
  // expect(await swaptokenContract.balanceOf(diamond.address)).to.equal(exchange_amount); //Nor equal as pool changes
  expect((await Faucet2.getToken(token))[2]).to.equal(initFee + unlockFeeAmount);
  expect((await Faucet2.getLockedAsset(1))[10]).to.equal(1) //status is closed
  expect(await swaptokenContract.balanceOf(coin_whale.address)).to.equal(coinWhaleSwaptokenContractBalance.add(gift_exchange_amount));
  expect(await tokenContract.balanceOf(contractOwner2.address)).to.equal(contractOwner2TokenBalance);

  expect(await  tokenContract.balanceOf(contractOwner1.address)).to.equal(0);
  await expect(Faucet2.connect(coin_whale).submitBeneficiary(1, "Helloooo", "0xeeda6f3ed6ecdea92b1589de40021769f2e3464dc825907bdce5065f10f90e2868fe6950e34cbc80025c981cfeab715859828566f6369cded411a825f0e266c21c", USDC, contractOwner1.address)).to.be.revertedWith('false signature');

  const tx = Faucet2.connect(contractOwner2).submitBeneficiary(1, "Hello", "0xeeda6f3ed6ecdea92b1589de40021769f2e3464dc825907bdce5065f10f90e2868fe6950e34cbc80025c981cfeab715859828566f6369cded411a825f0e266c21c", USDC, contractOwner1.address)
  //----------------
  expect(await tokenContract.balanceOf(diamond.address)).to.equal(initFee); 
  expect(await  tokenContract.balanceOf(contractOwner1.address)).to.equal(0);
  console.log(await  swaptokenContract.balanceOf(diamond.address), "aaaaaaaaaaaaaaaaaaa");
  // expect(await  swaptokenContract.balanceOf(contractOwner1.address)).to.equal(exchange_amount_after_claim); 

  })
})

  describe ("Check Fees", () => {
    it ("check giftreward transaction", async () => {
      const{Faucet1, Faucet2, contractOwner1, diamond} = await loadFixture(deployTokenFixture);
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd2 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);
      let TxApprove = await link.connect(coin_whale).approve(Faucet1.address, 2000000000000000);  

      const token = LINK;
      const amount = 1000000000000n;
      feeRate = 10n;   //depends on the amount depositied
      const fee = amount*feeRate/100n; 
      const endDate = 1743743187;

      const unlockFee = 0n;
      const unlockFeeAmount = amount*unlockFee/100n;
      const amountToSwap = amount-unlockFeeAmount
      console.log("amountToSwap", amountToSwap);

      const startFee = 0n;
      const affiliateFee = 10n;
      const slippage = 20n;
      const giftRewardRate = 10n
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)


      //Deposit
  const depositParams = {
    _addr: [token, contractOwner1.address, contractOwner2.address],
    _amount:amount,
    _otherFees: 0,
    _endDate: endDate,
    _target: 200,
    _features:[true, true, true],
    _uuid: "AAA-UUID",
    _skinId : 111,
  }
  let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParams);
  
  //---------------

      let TxViewLockAsset= await Faucet2.getLockedAsset(1);
      console.log("TxViewLockAsset", TxViewLockAsset);

      let txExecuteGetAmountOutMin1= await Faucet2.executeGetAmountOutMin(LINK, DAI, amount);
      let exchange_amount= await Faucet2.getAmountOutMin();
      console.log("exchange_amount", exchange_amount);
      let txExecuteGetAmountOutMin2 = await Faucet2.executeGetAmountOutMin(LINK, DAI, amount/10n);
      let exchanged_amount_giftreward= await Faucet2.getAmountOutMin()
      console.log("exchanged_amount_giftreward", exchanged_amount_giftreward);

      //Time manipulations
      await time.increaseTo(endDate);
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

      const token = LINK;
      const tokenContract = link;
      const unlockFee = 10n;
      const startFee = 0n;
      const affiliateFee = 3n;
      const slippage = 20n;
      const giftRewardRate = 10n
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)

      const amount = 1000000000000;

      const endDate = 1743743187;

      const cont2BalanceLinkBef = await link.balanceOf(contractOwner2.address)

            //Deposit
  const depositParams = {
    _addr: [token, contractOwner1.address, contractOwner2.address],
    _amount:amount,
    _otherFees: 0,
    _endDate: endDate,
    _target: 200,
    _features:[true, true, true],
    _uuid: "AAA-UUID",
    _skinId : 111,
  }
  let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParams);
  
  //---------------
  
      const cont2BalanceLinkAft= await tokenContract.balanceOf(contractOwner2.address)

      console.log("cont2BalanceLinkBef", cont2BalanceLinkBef);
      console.log("cont2BalanceLinkAft", cont2BalanceLinkAft);

      expect(await tokenContract.balanceOf(contractOwner2.address)).to.equal((amount*0.1)*0.03);

      // let TxViewLockAsset= await Faucet2.getLockedAsset(1);
      // console.log("TxViewLockAsset", TxViewLockAsset);

      //Claim
    
      // expect(await dai.balanceOf(coin_whale.address)).to.equal(coinWhaleBalanceDaiAft);
      // expect(await tokenContract.balanceOf(diamond.address)).to.equal(90000000000);
    })
  })


describe ("MATIC Transactions",() => {
  it ('matic can be locked', async () => {
    const{Faucet1, Faucet2, contractOwner1, diamond} = await loadFixture(deployTokenFixture);
    let txAdd2 = await Faucet2.addToken(ETH,1,pricefeed_eth, 18);
    let txAdd4 = await Faucet2.addToken(USDT,1,pricefeed_usdt, 18);

    const unlockFee = 0n;
    const startFee = 0n;
    const affiliateFee = 0n;
    const slippage = 20n;
    const giftRewardRate = 10n

    let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)
    
    const token = ETH;
    const amount = 100000000000000
    const amountETH = 110000000000000;
    const otherFees = 0;
    let options={
      value: amountETH
     }
    const endDate = 1743743187;
    
    // console.log("OWNER1 Balance of Eth AFTER: ", await ethers.provider.getBalance(contractOwner1.address));

      //Deposit
  const depositParams1 = {
    _addr: [token, contractOwner1.address, contractOwner2.address],
    _amount:amount,
    _otherFees: otherFees,
    _endDate: endDate,
    _target: 200,
    _features:[true, false, true],
    _uuid: "AAA-UUID",
    _skinId : 111,
  }
  let txDeposit1 = await Faucet1.deposit(depositParams1, options);

  console.log("DIAMOND Balance of Eth AFTER Deposit: ", await ethers.provider.getBalance(diamond.address));
  tokenAmount = await Faucet2.getToken(ETH);
  console.log("tokenAmount", tokenAmount.collectedFees)
  console.log(await Faucet2.getBalanceOf(depositParams1._addr[1],token),"innerBalanecOF1")



  const depositParams2 = {
    _addr: [token, contractOwner1.address, contractOwner2.address],
    _amount:amount,
    _otherFees: otherFees,
    _endDate: endDate,
    _target: 200,
    _features:[true, false, true],
    _uuid: "BBB-UUID",
    _skinId : 112,
  }
  let txDeposit2 = await Faucet1.deposit(depositParams2, options);
  console.log("DIAMOND Balance of Eth AFTER Deposit2: ", await ethers.provider.getBalance(diamond.address));
  tokenAmount = await Faucet2.getToken(ETH);
  console.log("tokenAmount2", tokenAmount.collectedFees)
  console.log(await Faucet2.getBalanceOf(depositParams2._addr[1],token),"innerBalanecOF2")

  //---------------

  
    // console.log("DIAMOND Balance of Eth AFTER DEPOSIT BEFORE CLAIM: ", await ethers.provider.getBalance(diamond.address));

    // console.log("OWNER1 Balance of Eth AFTER: ", await ethers.provider.getBalance(contractOwner1.address));

    // tokenAmount = await Faucet2.getToken(ETH);
    // console.log("tokenAmount", tokenAmount)           
    expect( (await Faucet2.getToken(ETH))[2]).to.equal(2*10000000000000+otherFees);
    expect( await ethers.provider.getBalance(diamond.address)).to.equal(2*amountETH);

    //Time manipulations
    await time.increaseTo(endDate);
    // -----------------
    TxClaim1 = await Faucet1.claim(1, USDT);
    console.log(await Faucet2.getBalanceOf(depositParams1._addr[1],token),"innerBalanecOF3")


    TxClaim2 = await Faucet1.claim(2, USDT);

    console.log(await Faucet2.getBalanceOf(depositParams2._addr[1],token),"innerBalanecOF4")

    expect( (await Faucet2.getToken(ETH))[2]).to.equal(2*10000000000000+otherFees);

    console.log("DIAMOND Balance of Eth AFTER DEPOSIT AFTER CLAIM 111: ", await ethers.provider.getBalance(diamond.address));
    expect( await ethers.provider.getBalance(diamond.address)).to.equal(2*(amountETH-amount));
    await Faucet2.swapTokenBalance(ETH);
    console.log("DIAMOND Balance of Eth after swapTokenBalance: ", await ethers.provider.getBalance(diamond.address));

    // let TxDeposit3 = await Faucet1.deposit([ ETH, contractOwner1.address, contractOwner2.address], amount, 0,endDate,200,[true, false, true], 'uuiddd', options);

    // expect(await link.balanceOf(diamond.address)).to.equal(250505050505);

    // let afterClaim = await  Faucet2.getLockedAsset(1);
    
    // console.log('Claimed');
    // console.log(afterClaim);
    // console.log("DIAMOND Balance of Eth AFTER CLAIM: ", await ethers.provider.getBalance(diamond.address));

    expect((await  Faucet2.getLockedAsset(1))[10]).to.equal(1);

  })
}) 

  describe ("Transfer Beneficary Testing",() => {
    it ('should transfer the nft with transferB()', async() =>{
      const{Faucet1, Faucet2, contractOwner1, coin_whale,gemChest, link} = await loadFixture(deployTokenFixture);
      const endDate = 1743743187;

      const unlockFee = 0n;
      const startFee = 0n;
      const affiliateFee = 0n;
      const slippage = 20n;
      const giftRewardRate = 10n
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)
      
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd2 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);

      let TxApprove = await link.connect(coin_whale).approve(Faucet1.address, 1000000000000000);

      token = LINK;
      amount = 100000000000000;


      const depositParam1 = {
        _addr: [token, coin_whale.address, contractOwner2.address],
        _amount:amount,
        _otherFees: 0,
        _endDate: endDate,
        _target: 200,
        _features:[true, true, true],
        _uuid: "BBB-UUID",
        _skinId : 111,
      }
      let txDeposit2 = await Faucet1.connect(coin_whale).deposit(depositParam1);
    
      
      expect(await gemChest.ownerOf(1)).to.equal(coin_whale.address);

      let TxFromNftTransfer = await gemChest.connect(coin_whale).transferFrom(coin_whale.address, contractOwner1.address,1);

      expect((await  Faucet2.getLockedAsset(1))[1]).to.equal(contractOwner1.address);
      expect(await gemChest.ownerOf(1)).to.equal(contractOwner1.address);

    })

    it ('should transfer the nft and lockedAsset using transferBeneficiary()', async() =>{  //Test Again
      const{Faucet1, Faucet2, contractOwner1, coin_whale,gemChest, link, diamond}= await loadFixture(deployTokenFixture);

      const unlockFee = 0n;
      const startFee = 0n;
      const affiliateFee = 0n;
      const slippage = 20n;
      const giftRewardRate = 10n
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)
      const endDate = 1743743187;

      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link, 18);
      let txAdd2 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);

      let TxApprove = await link.connect(coin_whale).approve(Faucet1.address, 1000000000000000);

      token = LINK;
      const amount = 100000000000000;

      const depositParam1 = {
        _addr: [token, coin_whale.address, contractOwner2.address],
        _amount:amount,
        _otherFees: 0,
        _endDate: endDate,
        _target: 200,
        _features:[true, true, true],
        _uuid: "BBB-UUID",
        _skinId : 111,
      }
      let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParam1);
      let txDeposit2 = await Faucet1.connect(coin_whale).deposit(depositParam1);


      // let TxDeposit1 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],amount,0, endDate,300,[true, true, true], 'aaa');
      // let TxDeposit2 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],amount,0, endDate,300,[true, true, true], 'aaa');
      console.log(await gemChest.ownerOf(2), "2 OWNER Before");
      // console.log("getLockedAsset 2 Before", await  Faucet2.getLockedAsset(2));
      let TxTransferBeneficary = await Faucet1.connect(coin_whale).transferBeneficiary(contractOwner2.address, 2);
      console.log("getLockedAsset 2 After", await  Faucet2.getLockedAsset(2));
      // console.log(await gemChest.ownerOf(2), "2 OWNER After");

      expect(await gemChest.ownerOf(1)).to.equal(coin_whale.address);
      expect(await gemChest.ownerOf(2)).to.equal(contractOwner2.address);

    })


    it ('should transfer the nft and lockedAsset', async() =>{
      const{Faucet1, Faucet2, contractOwner1, coin_whale,gemChest, link}= await loadFixture(deployTokenFixture);
      
      const unlockFee = 0n;
      const startFee = 0n;
      const affiliateFee = 0n;
      const slippage = 20n;
      const giftRewardRate = 10n
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)

      const amount = 100000000000000
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
      let txAdd2 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);

      token = LINK;

      const depositParam1 = {
        _addr: [token, coin_whale.address, contractOwner2.address],
        _amount:amount,
        _otherFees: 0,
        _endDate: endDate,
        _target: 200,
        _features:[true, true, true],
        _uuid: "BBB-UUID",
        _skinId : 111,
      }


      TxApprove = await link.connect(coin_whale).approve(Faucet1.address, 300000000000000);

      let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParam1);

      expect((await  Faucet2.getLockedAsset(1))[1]).to.equal(coin_whale.address);

      TxFromNftTransfer = await gemChest.connect(coin_whale).transferFrom(coin_whale.address, contractOwner1.address,1);

      expect((await  Faucet2.getLockedAsset(1))[1]).to.equal(contractOwner1.address);

      let txDeposit2 = await Faucet1.connect(coin_whale).deposit(depositParam1);
 
      expect((await  Faucet2.getLockedAsset(2))[1]).to.equal(coin_whale.address);

      TxTransferBeneficary = await Faucet1.connect(coin_whale).transferBeneficiary(contractOwner1.address,2)

      expect((await  Faucet2.getLockedAsset(2))[1]).to.equal(contractOwner1.address);

    })
})

describe ("Check Contract Balance Operations", () => {
  it ("check swapTokenBalance for different tokens, not ETH", async () => {
    const{Faucet1, Faucet2, contractOwner1, coin_whale,gemChest, link, diamond}= await loadFixture(deployTokenFixture);
    const unlockFee = 0n;
    const startFee = 0n;
    const affiliateFee = 0n;
    const slippage = 20n;
    const giftRewardRate = 10n
    
    let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)

    let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
    let txAdd2 = await Faucet2.addToken(USDC,1,pricefeed_usdc,18);
    let txAdd3 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);

    let TxApprove1 = await link.connect(coin_whale).approve(Faucet1.address, 1000000000000000);
    let TxApprove2 = await usdc.connect(coin_whale).approve(Faucet1.address, 1000000000000000);
    let TxApprove3 = await dai.connect(coin_whale).approve(Faucet1.address, 1000000000000000);

    tokenAmount1 =await Faucet2.getToken(LINK);

    const token = LINK;
    const amount =  100000000000000;
    const otherFees = 55555555555555;

    const depositParam1 = {
      _addr: [token, coin_whale.address, contractOwner2.address],
      _amount:amount,
      _otherFees: otherFees,
      _endDate: endDate,
      _target: 200,
      _features:[true, true, true],
      _uuid: "BBB-UUID",
      _skinId : 111,
    }

    let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParam1);

    let txExecuteGetAmountOutMin= await Faucet2.executeGetAmountOutMin(LINK, DAI, 10000000000000+otherFees);
    let exchange_amount= await Faucet2.getAmountOutMin();
    console.log("getAmountOutMin", exchange_amount);


    expect(await dai.balanceOf(contractOwner1.address)).to.equal(0);
    expect(await link.balanceOf(diamond.address)).to.equal(110000000000000 + otherFees);
    expect((await Faucet2.getToken(LINK))[2]).to.equal(10000000000000 + otherFees);
    
    const txSwapToken = await Faucet2.swapTokenBalance(LINK);

    // expect(await dai.balanceOf(contractOwner1.address)).to.equal(exchange_amount);
    expect(await link.balanceOf(diamond.address)).to.equal(amount);
    expect((await Faucet2.getToken(LINK))[2]).to.equal(0);
  })

  it ("check swapTokenBalance for the same token input, not ETH", async () => {
    const{Faucet1, Faucet2, contractOwner1, coin_whale,gemChest, link, diamond}= await loadFixture(deployTokenFixture);
    const unlockFee = 0n;
    const startFee = 0n;
    const affiliateFee = 0n;
    const slippage = 20n;
    const giftRewardRate = 10n
    
    let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)

    let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link,18);

    let TxApprove1 = await link.connect(coin_whale).approve(Faucet1.address, 1000000000000000);

    token = LINK;
    const amount =  100000000000000;
    const otherFees = 55555555555555;

    const depositParam1 = {
      _addr: [token, coin_whale.address, contractOwner2.address],
      _amount:amount,
      _otherFees: otherFees,
      _endDate: endDate,
      _target: 200,
      _features:[true, true, true],
      _uuid: "BBB-UUID",
      _skinId : 111,
    }

    let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParam1);

    // TxDeposit1 = await Faucet1.connect(coin_whale).deposit([LINK, coin_whale.address, contractOwner2.address],amount,otherFees, endDate,300,[true, true, true], 'aaa');      

    expect(await dai.balanceOf(contractOwner1.address)).to.equal(0);
    expect(await link.balanceOf(diamond.address)).to.equal(110000000000000 + otherFees);
    expect((await Faucet2.getToken(LINK))[2]).to.equal(10000000000000 + otherFees);
    
    const txSwapToken = await Faucet2.swapTokenBalance(LINK);

    expect(await link.balanceOf(contractOwner1.address)).to.equal(10000000000000 + otherFees);
    expect(await link.balanceOf(diamond.address)).to.equal(amount);
    expect((await Faucet2.getToken(LINK))[2]).to.equal(0);
  })


  

  it ("check swapTokenBalance tokenOut == ETH", async () => {
    const{Faucet1, Faucet2, contractOwner1, coin_whale,gemChest, link, diamond}= await loadFixture(deployTokenFixture);
    const unlockFee = 0n;
    const startFee = 0n;
    const affiliateFee = 0n;
    const slippage = 20n;
    const giftRewardRate = 10n
    
    let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)

    let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
    let txAdd2 = await Faucet2.addToken(ETH,1,pricefeed_eth, 18);

    let TxApprove1 = await link.connect(coin_whale).approve(Faucet1.address, 10000000000000000000n);

    let options={
      value: 11000000000
     }

    token = LINK;
    const amount = 1000000000000000000n
    const otherFees =  5555555555n

    const depositParam1 = {
      _addr: [token, coin_whale.address, contractOwner2.address],
      _amount:amount,
      _otherFees: otherFees,
      _endDate: endDate,
      _target: 200,
      _features:[true, true, true],
      _uuid: "BBB-UUID",
      _skinId : 111,
    }

    let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParam1);

    // let txExecuteGetAmountOutMin= await Faucet2.executeGetAmountOutMin(LINK, ETH, 100000000000000000n+otherFees);
    // let exchange_amount= await Faucet2.getAmountOutMin();
    // console.log("getAmountOutMin", exchange_amount);
    
    let bfr_link= await link.balanceOf(diamond.address);

    const ethBalofOwner1Before = await ethers.provider.getBalance(contractOwner1.address)
    // console.log("OWNER1 Balance of Eth BEFORE: ", await ethers.provider.getBalance(contractOwner1.address));

    // expect(await wmatic.balanceOf(contractOwner1.address)).to.equal(0);
    expect(await link.balanceOf(diamond.address)).to.equal(1100000000000000000n + otherFees);
    expect((await Faucet2.getToken(LINK))[2]).to.equal(100000000000000000n + otherFees);

    const txSwapToken = await Faucet2.swapTokenBalance(LINK);

    let aft_link= await link.balanceOf(diamond.address);
    // let aft_dai= await wmatic.balanceOf(contractOwner1.address);

    console.log("bfr_link", bfr_link);
    console.log("aft_link", aft_link);
    // console.log("aft_dai", aft_dai);
    
    // console.log("OWNER1 Balance of Eth After: ", await ethers.provider.getBalance(contractOwner1.address));
    expect(await link.balanceOf(diamond.address)).to.equal(amount);
    expect((await Faucet2.getToken(LINK))[2]).to.equal(0);
    // expect(await link.balanceOf(dcontractOwner1.address)).to.equal(amount));

    expect(await link.balanceOf(contractOwner1.address)).to.equal(100000000000000000n+otherFees); 
  })

  it ("check swapTokenBalance tokenIn == ETH", async () => {
    const{Faucet1, Faucet2, contractOwner1, coin_whale,gemChest, link, diamond}= await loadFixture(deployTokenFixture);
    const unlockFee = 0n;
    const startFee = 0n;
    const affiliateFee = 0n;
    const slippage = 20n;
    const giftRewardRate = 10n
    
    let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)

    let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
    let txAdd2 = await Faucet2.addToken(USDC,1,pricefeed_usdc,6);
    let txAdd3 = await Faucet2.addToken(ETH,1,pricefeed_eth, 18);

    let TxApprove1 = await link.connect(coin_whale).approve(Faucet1.address, 10000000000000000000n);

    let options={
      value: 110000000000000000000n
     }

    const token = ETH;
    const amount = 100000000000000000000n
    const otherFees =       0n

    const depositParam1 = {
      _addr: [token, coin_whale.address, contractOwner2.address],
      _amount:amount,
      _otherFees: otherFees,
      _endDate: endDate,
      _target: 200,
      _features:[true, true, true],
      _uuid: "BBB-UUID",
      _skinId : 111,
    }

    let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParam1,options);
    
    // let bfr_link= await link.balanceOf(diamond.address);

    const ethBalofOwner1Before = await ethers.provider.getBalance(contractOwner1.address)
    console.log("OWNER1 Balance of Eth BEFORE: ", await ethers.provider.getBalance(contractOwner1.address));

    // let txExecuteGetAmountOutMin= await Faucet2.executeGetAmountOutMin(ETH, LINK, 3000000000000000000n+otherFees);
    // let exchange_amount= await Faucet2.getAmountOutMin();
    // console.log("getAmountOutMin", exchange_amount);

    expect(await wmatic.balanceOf(contractOwner1.address)).to.equal(0);
    expect(await link.balanceOf(contractOwner1.address)).to.equal(0);
    expect((await Faucet2.getToken(ETH))[2]).to.equal(3000000000000000000n + otherFees);

    const txSwapToken = await Faucet2.swapTokenBalance(ETH);

    //GAS
    const gasPrice = await ethers.provider.getGasPrice();
    console.log("gasPrice", gasPrice)
    const receipt = await txSwapToken.wait()
    const gasUsed = receipt.gasUsed;
    const gasFee = gasUsed.mul(gasPrice);
    console.log("gasFee", gasFee)
    //-------------------

    // let aft_link= await link.balanceOf(diamond.address);
    // let aft_dai= await wmatic.balanceOf(contractOwner1.address);
    
    console.log("OWNER1 Balance of Eth Before:", ethBalofOwner1Before)
    console.log("OWNER1 Balance of Eth After: ", await ethers.provider.getBalance(contractOwner1.address));
    // expect(await link.balanceOf(contractOwner1.address)).to.equal(exchange_amount);
    expect((await Faucet2.getToken(ETH))[2]).to.equal(0);
  })

  it ("check swapTokenBalance tokenIn == ETH and tokenOut = ETH", async () => {
    const{Faucet1, Faucet2, contractOwner1, coin_whale,gemChest, link, diamond}= await loadFixture(deployTokenFixture);
    const unlockFee = 0n;
    const startFee = 0n;
    const affiliateFee = 0n;
    const slippage = 20n;
    const giftRewardRate = 10n
    
    let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)

    let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
    let txAdd2 = await Faucet2.addToken(USDC,1,pricefeed_usdc,18);
    let txAdd3 = await Faucet2.addToken(ETH,1,pricefeed_eth, 18);

    let TxApprove1 = await link.connect(coin_whale).approve(Faucet1.address, 10000000000000000000n);

    let options={
      value: 110000000000000000000n
     }

    const token = ETH;
    const amount = 100000000000000000000n
    const otherFees =       0n

    const depositParam1 = {
      _addr: [token, coin_whale.address, contractOwner2.address],
      _amount:amount,
      _otherFees: otherFees,
      _endDate: endDate,
      _target: 200,
      _features:[true, false, true],
      _uuid: "BBB-UUID",
      _skinId : 111,
    }

    let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParam1,options);
    
    let bfr_link= await link.balanceOf(diamond.address);
    
    const ethBalofOwner1Before = await ethers.provider.getBalance(contractOwner1.address)
    console.log("OWNER1 Balance of Eth BEFORE: ", await ethers.provider.getBalance(contractOwner1.address));
    
    expect(await wmatic.balanceOf(contractOwner1.address)).to.equal(0);
    expect((await Faucet2.getToken(ETH))[2]).to.equal(3000000000000000000n + otherFees);
    
    const txSwapToken = await Faucet2.swapTokenBalance(ETH);

    //GAS
    const gasPrice = await ethers.provider.getGasPrice();
    console.log("PPPPPPPPP", gasPrice)
    const receipt = await txSwapToken.wait()
    const gasUsed = receipt.gasUsed;
    const gasFee = gasUsed.mul(gasPrice);
    console.log("gasFee", gasFee)
    //-------------------
    
    console.log("OWNER1 Balance of Eth Before:", ethBalofOwner1Before)
    console.log("OWNER1 Balance of Eth After: ", await ethers.provider.getBalance(contractOwner1.address));
    expect((await Faucet2.getToken(ETH))[2]).to.equal(0);
    // expect(await wmatic.balanceOf(contractOwner1.address)).to.equal(100000000n + otherFees);
    // expect(await ethers.provider.getBalance(contractOwner1.address)).to.equal((ethBalofOwner1Before.add(3000000000000000000n + otherFees)).sub(gasFee))
  })
})


  describe ("Bulk Claim", () => {
    it ("calim given asset id's", async() =>{
      const{Faucet1, Faucet2, contractOwner1, coin_whale,gemChest, link, diamond}= await loadFixture(deployTokenFixture);

      let txAdd2 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
      let txAdd3 = await Faucet2.addToken(USDC,1,pricefeed_usdc,6);
      let txAdd4 = await Faucet2.addToken(ETH,1,pricefeed_usdc,18);
      let txAdd5 = await Faucet2.addToken(DAI,1,pricefeed_usdc,8);
      let txAdd6 = await Faucet2.addToken(USDT,1,pricefeed_usdt,8);
      let txAdd7 = await Faucet2.addToken(WETH,1,pricefeed_weth,8);
      let txAdd8 = await Faucet2.addToken(ZETA,1,pricefeed_weth,8);



      const unlockFee = 0n;
      const startFee = 0n;
      const affiliateFee = 0n;
      const slippage = 20n;
      const giftRewardRate = 10n
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)
  
      let TxApprove1 = await link.connect(coin_whale).approve(Faucet1.address, 25050505050500);
      let TxApprove2 = await usdc.connect(coin_whale).approve(Faucet1.address, 25050505050500);
      let TxApprove3 = await dai.connect(coin_whale).approve(Faucet1.address, 25050505050500);
      let TxApprove4 = await weth.connect(coin_whale).approve(Faucet1.address, 25050505050500);
      let TxApprove5 = await usdt.connect(coin_whale).approve(Faucet1.address, 25050505050500);

      const token1 = LINK;
      const token2 = WETH
      const amount = 2505050505050;
      const otherFees = 0n


      let options={
        value: 250505050505000
       }

       const depositParam1 = {
        _addr: [token1, coin_whale.address, contractOwner2.address],
        _amount:amount,
        _otherFees: otherFees,
        _endDate: endDate,
        _target: 200,
        _features:[true, false, true],
        _uuid: "BBB-UUID",
        _skinId : 111,
      }

      const depositParam2 = {
        _addr: [token2, coin_whale.address, contractOwner2.address],
        _amount:amount,
        _otherFees: otherFees,
        _endDate: endDate,
        _target: 200,
        _features:[true, false, true],
        _uuid: "BBB-UUID",
        _skinId : 111,
      }
  
      const depositParam3 = {
        _addr: [token2, coin_whale.address, contractOwner2.address],
        _amount:amount,
        _otherFees: otherFees,
        _endDate: endDate,
        _target: 200,
        _features:[true, false, true],
        _uuid: "BBB-UUID",
        _skinId : 111,
      }
      
      const depositParam4 = {
        _addr: [token2, coin_whale.address, contractOwner2.address],
        _amount:amount,
        _otherFees: otherFees,
        _endDate: endDate,
        _target: 200,
        _features:[true, false, true],
        _uuid: "BBB-UUID",
        _skinId : 111,
      }

      const depositParam5 = {
        _addr: [token2, coin_whale.address, contractOwner2.address],
        _amount:amount,
        _otherFees: otherFees,
        _endDate: endDate,
        _target: 200,
        _features:[true, false, true],
        _uuid: "BBB-UUID",
        _skinId : 111,
      }

      const depositParam6 = {
        _addr: [token2, coin_whale.address, contractOwner2.address],
        _amount:amount,
        _otherFees: otherFees,
        _endDate: endDate,
        _target: 200,
        _features:[true, false, true],
        _uuid: "BBB-UUID",
        _skinId : 111,
      }

      const depositParam7 = {
        _addr: [token2, coin_whale.address, contractOwner2.address],
        _amount:amount,
        _otherFees: otherFees,
        _endDate: endDate,
        _target: 200,
        _features:[true, false, true],
        _uuid: "BBB-UUID",
        _skinId : 111,
      }

      const depositParam8 = {
        _addr: [token2, coin_whale.address, contractOwner2.address],
        _amount:amount,
        _otherFees: otherFees,
        _endDate: endDate,
        _target: 200,
        _features:[true, false, true],
        _uuid: "BBB-UUID",
        _skinId : 111,
      }

      const depositParam9 = {
        _addr: [token2, coin_whale.address, contractOwner2.address],
        _amount:amount,
        _otherFees: otherFees,
        _endDate: endDate,
        _target: 200,
        _features:[true, false, true],
        _uuid: "BBB-UUID",
        _skinId : 111,
      }

      const depositParam10 = {
        _addr: [token2, coin_whale.address, contractOwner2.address],
        _amount:amount,
        _otherFees: otherFees,
        _endDate: endDate,
        _target: 200,
        _features:[true, false, true],
        _uuid: "BBB-UUID",
        _skinId : 111,
      }

      let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParam1);
      let txDeposit2 = await Faucet1.connect(coin_whale).deposit(depositParam1);
      let txDeposit3 = await Faucet1.connect(coin_whale).deposit(depositParam3,);
      let TxDeposit4 = await Faucet1.connect(coin_whale).deposit(depositParam4);
      let TxDeposit5 = await Faucet1.connect(coin_whale).deposit(depositParam5);
      let TxDeposit6 = await Faucet1.connect(coin_whale).deposit(depositParam6);      
      let TxDeposit7 = await Faucet1.connect(coin_whale).deposit(depositParam7);
      let TxDeposit8 = await Faucet1.connect(coin_whale).deposit(depositParam8);
      let TxDeposit9 = await Faucet1.connect(coin_whale).deposit(depositParam9);
      let TxDeposit10 = await Faucet1.connect(coin_whale).deposit(depositParam10);


     
      //Time manipulations
      await time.increaseTo(endDate);
      // -----------------
      console.log("USDC",await usdc.balanceOf(COIN_WHALE));
      console.log("LINK",await link.balanceOf(COIN_WHALE));

      // let txClaim1 = await Faucet1.claim(1, USDC);

      console.log("USDC",await usdc.balanceOf(COIN_WHALE));
      console.log("LINK",await link.balanceOf(COIN_WHALE));


      try {
        let checkedArrays = await Faucet2.connect(coin_whale).checkClaim([1,2,3,4]);
        console.log(checkedArrays, "checkClaim1")
        let txbulkClaim = await Faucet1.bulkClaim([1,2,3,4,5,6,7,8,9,10], DAI);
      } catch(err) {
        console.log("errrrrrrrrrrrror");
        console.log(err.message);
      } finally {
        let checkedArrays = await Faucet2.connect(coin_whale).checkClaim([1,2,3,4]);
        console.log(checkedArrays), "checkClaim2";
      }
    })
  })

describe ("Test for time manipulations", () => {

  describe ("Check Contract as Beneficary", () => {    //Works in case of time manipulations
    it ("1. check submitBeneficiary by Beneficiary after claim", async () => {
      const{Faucet1, Faucet2, contractOwner1, coin_whale,gemChest, link, diamond}= await loadFixture(deployTokenFixture);
  
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
      let txAdd2 = await Faucet2.addToken(ETH,1,pricefeed_usdc,18);
      let txAdd3 = await Faucet2.addToken(DAI,1,pricefeed_usdc,8);
  
      const unlockFee = 0n;
      const startFee = 0n;
      const affiliateFee = 0n;
      const slippage = 20n;
      const giftRewardRate = 0n
      
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)
  
      let TxApprove1 = await link.connect(coin_whale).approve(Faucet1.address, 25050505050500);
      let TxApprove2 = await dai.connect(coin_whale).approve(Faucet1.address, 25050505050500);
  
      const token = LINK;
      const amount = 2505050505050
      const endDate = 1743743187;
      const otherFees = 0n
  
        let options={
        value: 300000000000000
       }

       const depositParam1 = {
        _addr: [token, contractOwner2.address, contractOwner2.address],
        _amount:amount,
        _otherFees: otherFees,
        _endDate: endDate,
        _target: 200,
        _features:[false, true, true],
        _uuid: "BBB-UUID",
        _skinId : 111,
      }
  
      let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParam1,options);
    
      let txExecuteGetAmountOutMin= await Faucet2.executeGetAmountOutMin(LINK, DAI, amount);
      let exchange_amount= await Faucet2.getAmountOutMin();
      console.log("getAmountOutMin", exchange_amount);
      
      expect(await link.balanceOf(diamond.address)).to.equal(2505050505050*1.1);
      expect(await gemChest.ownerOf(1)).to.equal(diamond.address);
      expect(await dai.balanceOf(diamond.address)).to.equal(0);
      expect(await dai.balanceOf(contractOwner1.address)).to.equal(0);
      expect(await gemChest.tokenURI(1)).to.equal("https://portal.gemchest.io/metadata/polygon/1/1.json");
  
      //Time manipulations  
      await time.increaseTo(endDate);
      // -----------------
       
      //------------Claim
      let txClaim1 = await Faucet1.claim(1, DAI);
      //-----------------

      expect(await dai.balanceOf(contractOwner1.address)).to.equal(0);
      expect(await dai.balanceOf(diamond.address)).to.equal(exchange_amount);
      await expect(
        Faucet2.connect(coin_whale).submitBeneficiary(1, "Helloooo", "0x7e130ea84cc85682ae4b16df92bb77b5541bf1ea16d559f7be1387582365611d299004a284c71d1a918f7a6996b34df4a7a11043450d4da9b0ad0655f7954ed91b", DAI, contractOwner1.address)
      ).to.be.revertedWith('false signature')
      console.log("*****************************************")
      console.log("")
      
      let TxCkaimGift1 = await Faucet2.connect(contractOwner3).submitBeneficiary(1, "Hello", "0x7e130ea84cc85682ae4b16df92bb77b5541bf1ea16d559f7be1387582365611d299004a284c71d1a918f7a6996b34df4a7a11043450d4da9b0ad0655f7954ed91b", DAI, contractOwner1.address);
      expect(await dai.balanceOf(diamond.address)).to.equal(0);
      expect(await dai.balanceOf(contractOwner1.address)).to.equal(exchange_amount);
      await expect(gemChest.tokenURI(1)).to.be.revertedWith("ERC721: invalid token ID");
      await expect(gemChest.ownerOf(1)).to.be.revertedWith("ERC721: invalid token ID");
      })
  
      it ("2. check submitBeneficiary by Beneficiary before claim", async () => {
        const{Faucet1, Faucet2, contractOwner1, coin_whale,gemChest, link, diamond}= await loadFixture(deployTokenFixture);
    
        let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
        let txAdd2 = await Faucet2.addToken(ETH,1,pricefeed_usdc,18);
        let txAdd3 = await Faucet2.addToken(DAI,1,pricefeed_usdc,8);
    
        const unlockFee = 0n;
        const startFee = 0n;
        const affiliateFee = 0n;
        const slippage = 20n;
        const giftRewardRate = 10n
        
        let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)
    
        let TxApprove1 = await link.connect(coin_whale).approve(Faucet1.address, 25050505050500);
        let TxApprove2 = await dai.connect(coin_whale).approve(Faucet1.address, 25050505050500);
    
        const token = LINK;
        const amount = 2505050505050
        const endDate = 1743743187;
        const otherFees = 0;
  
    
          let options={
          value: 300000000000000
         }


         const depositParam1 = {
          _addr: [token, "0x0000000000000000000000000000000000000011", contractOwner2.address],
          _amount:amount,
          _otherFees: otherFees,
          _endDate: endDate,
          _target: 200,
          _features:[false, false, true],
          _uuid: "BBB-UUID",
          _skinId : 111,
        }


    
        let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParam1);
    
        // console.log("_________________________________BALANCES")
        // console.log(await Faucet2.getBalanceOf(contractOwner1.address,LINK));
        // console.log(await Faucet2.getBalanceOf("0x0000000000000000000000000000000000000011",LINK));
        // console.log(await Faucet2.getBalanceOf(contractOwner3.address,LINK));

    
        let txExecuteGetAmountOutMin= await Faucet2.executeGetAmountOutMin(LINK, DAI, amount);
        let exchange_amount= await Faucet2.getAmountOutMin();
        console.log("getAmountOutMin", exchange_amount);
        
        
        expect(await link.balanceOf(diamond.address)).to.equal(2505050505050*1.1);
        expect(await gemChest.ownerOf(1)).to.equal(diamond.address);
        expect(await gemChest.getApproved(1)).to.equal("0x0000000000000000000000000000000000000000");
        expect(await dai.balanceOf(diamond.address)).to.equal(0);
        expect(await dai.balanceOf(contractOwner1.address)).to.equal(0);
        expect((await Faucet2.getLockedAsset(1))[1]).to.equal("0x0000000000000000000000000000000000000011");
        expect(await gemChest.tokenURI(1)).to.equal("https://portal.gemchest.io/metadata/polygon/1/1.json");
        
        let TxCkaimGift1 = await Faucet2.connect(contractOwner3).submitBeneficiary(1, "Hello", "0x7e130ea84cc85682ae4b16df92bb77b5541bf1ea16d559f7be1387582365611d299004a284c71d1a918f7a6996b34df4a7a11043450d4da9b0ad0655f7954ed91b", DAI, contractOwner1.address);
  
        // console.log("_________________________________BALANCES")
        // console.log(await Faucet2.getBalanceOf(contractOwner1.address,LINK));
        // console.log(await Faucet2.getBalanceOf("0x0000000000000000000000000000000000000011",LINK));
        // console.log(await Faucet2.getBalanceOf(contractOwner3.address,LINK));

        expect(await gemChest.ownerOf(1)).to.equal(contractOwner1.address);

        expect((await Faucet2.getLockedAsset(1))[1]).to.equal(contractOwner1.address);
  
  
        //Time manipulations
        await time.increaseTo(endDate);
        // -----------------
    
        let txClaim1 = await Faucet1.claim(1, DAI);
    
        expect(await dai.balanceOf(contractOwner1.address)).to.equal(exchange_amount);
        await expect(gemChest.ownerOf(1)).to.be.revertedWith("ERC721: invalid token ID");
        })








  
  
      it ("3. check Submit submitBeneficiary from BACKEND", async () => {
        const{Faucet1, Faucet2, contractOwner1, coin_whale,gemChest, link, diamond}= await loadFixture(deployTokenFixture);
    
        let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
        let txAdd2 = await Faucet2.addToken(USDC,1,pricefeed_usdc,8);
        let txAdd3 = await Faucet2.addToken(ETH,1,pricefeed_usdc,18);
        let txAdd4 = await Faucet2.addToken(DAI,1,pricefeed_usdc,8);
    
        const unlockFee = 0n;
        const startFee = 0n;
        const affiliateFee = 0n;
        const slippage = 20n;
        const giftRewardRate = 10n
        
        let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)
    
        let TxApprove1 = await link.connect(coin_whale).approve(Faucet1.address, 25050505050500);
        let TxApprove2 = await usdc.connect(coin_whale).approve(Faucet1.address, 25050505050500);
        let TxApprove3 = await dai.connect(coin_whale).approve(Faucet1.address, 25050505050500);
    
        let options={
          value: 300000000000000
         }
         const token = LINK;
         let amount = 2505050505050;
         const otherFees = 0n;

         const depositParam1 = {
          _addr: [token, coin_whale.address, contractOwner2.address],
          _amount:amount,
          _otherFees: otherFees,
          _endDate: endDate,
          _target: 200,
          _features:[false, false, true],
          _uuid: "BBB-UUID",
          _skinId : 111,
        }
    
        let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParam1);
  
        // expect((await Faucet2.getLockedAsset(1))[1]).to.equal(diamond.address);
        
        let txExecuteGetAmountOutMin= await Faucet2.executeGetAmountOutMin(LINK, DAI, amount);
        let exchange_amount= await Faucet2.getAmountOutMin();
        console.log("getAmountOutMin", exchange_amount);
  
        expect(await dai.balanceOf(diamond.address)).to.equal(0);
        expect( await dai.balanceOf(contractOwner1.address)).to.equal(0);
  
        //Time manipulations
        await time.increaseTo(endDate);
        // -----------------
  
        let txClaim1 = await Faucet1.claim(1, DAI);
  
        expect(await dai.balanceOf(diamond.address)).to.equal(exchange_amount);
    
        let TxCkaimGift1 = await Faucet2.submitBeneficiary(1, "Hellooooooooooo", "0x7e130ea84cc85682ae4b16df92bb77b5541bf1ea16d559f7be1387582365611d299004a284c71d1a918f7a6996b34df4a7a11043450d4da9b0ad0655f7954ed91b", DAI, contractOwner1.address);
        
        expect(await dai.balanceOf(diamond.address)).to.equal(0);
        expect(await dai.balanceOf(contractOwner1.address)).to.equal(exchange_amount);
        
      })
    })




})



  describe ("Check GemChest", () => {
    it ("check setBaseURI()", async () => {
      const{gemChest, Faucet1, Faucet2}= await loadFixture(deployTokenFixture);
      let txAdd1 = await Faucet2.addToken(LINK,1,pricefeed_link,18);
      let txAdd2 = await Faucet2.addToken(DAI,1,pricefeed_dai, 18);

      let TxApprove1 = await link.connect(coin_whale).approve(Faucet1.address, 1000000000000000);
      const unlockFee = 0n;
      const startFee = 0n;
      const affiliateFee = 10n;
      const slippage = 20n;
      const giftRewardRate = 10n
      
      let txSettFixedFees = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)

      const token = LINK;
      const amount = 100000000000000;
      const otherFees = 0n;


      const depositParam1 = {
        _addr: [token, coin_whale.address, contractOwner2.address],
        _amount:amount,
        _otherFees: otherFees,
        _endDate: endDate,
        _target: 200,
        _features:[true, true, true],
        _uuid: "BBB-UUID",
        _skinId : 111,
      }
  
      
      await expect(
        gemChest.safeMint(COIN_WHALE,1)
      ).to.be.revertedWith("Only Faucet1");

      const  url = "https://portal.gemchest.io/metadata/polygon/1/1.json"

      let txDeposit1 = await Faucet1.connect(coin_whale).deposit(depositParam1);

      expect(await gemChest.tokenURI(1)).to.equal(url);

      //-------------------
    })
  })


  describe ("ROLES", () => {
    it ("check roles", async () => {
      const{gemChest, Faucet1, Faucet2,OwnershipFacet}= await loadFixture(deployTokenFixture);

      const unlockFee = 0n;
      const startFee = 0n;
      let affiliateFee = 10n;
      const slippage = 20n;
      const giftRewardRate = 10n
      
      let txSettFixedFees1 = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0);

      const labelhash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN"));
      // const labelhash = ethers.utils.id("ADMIN"))
      // await OwnershipFacet.revokeRole(labelhash, contractOwner1.address);

      await OwnershipFacet.grantRole(labelhash, contractOwner2.address);

      affiliateFee = 100n;
      let txSettFixedFees2 = await Faucet2.setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0);

      await OwnershipFacet.revokeRole(labelhash, contractOwner2.address);
      await expect(Faucet2.connect(contractOwner2).setFee(startFee, unlockFee, affiliateFee, slippage, giftRewardRate,[[1000000000,10],[5000000000, 5], [10000000000, 3]],3000,0)).to.be.revertedWith('account is missing role '),0;
    })
  
    it ("check AAddToken",  async () => {
      const{gemChest, Faucet1, Faucet2,OwnershipFacet}= await loadFixture(deployTokenFixture);
      let txAdd2 = await Faucet2.addTokenn( ["0x0000000000000000000000000000000000000001","0x0000000000000000000000000000000000000002","0x0000000000000000000000000000000000000003"],
      ["0x0000000000000000000000000000000000000004","0x0000000000000000000000000000000000000005","0x0000000000000000000000000000000000000006"],[1,2,3],[111,101,100])
      
      
      let get1 = await Faucet2.getToken("0x0000000000000000000000000000000000000001")
      let get2 = await Faucet2.getToken("0x0000000000000000000000000000000000000002")
      let get3 = await Faucet2.getToken("0x0000000000000000000000000000000000000003")


      console.log(get1)
      console.log(get2)
      console.log(get3)

    })

    })
})