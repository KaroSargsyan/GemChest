





// Get the two token prices of the pool
// PoolInfo = {"SqrtX96" : slot0.sqrtPriceX96.toString(), "Pair": pairName, "decimal0": decimal0, "decimal1": decimal1}
// let FactoryContract =  new ethers.Contract(factory, IUniswapV3FactoryABI, provider);
// let V3pool = await FactoryContract.getPool(token0, token1, fee);
// let poolContract =  new ethers.Contract(V3pool, IUniswapV3PoolABI, provider);
// let slot0 = await poolContract.slot0();

function GetPrice(PoolInfo){

    
    let sqrtPriceX96 = PoolInfo.SqrtX96;
    let decimal0 = PoolInfo.decimal0;
    let decimal1 = PoolInfo.decimal1;


    const buyToken0 = ((sqrtPriceX96 / 2**96)**2) / (10**decimal1 / 10**decimal0).toFixed(decimal1);
    const buyToken1 = (1 / buyToken0).toFixed(decimal0);

    console.log("price of token0 in val of token1 " + buyToken0.toString());
    console.log("price of token1 in val of token0 " + buyToken1.toString());
    const buyToken0Wei =(Math.floor(buyToken0 * (10**decimal1))).toLocaleString('fullwide', {useGrouping:false});
    const buyToken1Wei =(Math.floor(buyToken1 * (10**decimal0))).toLocaleString('fullwide', {useGrouping:false});
    console.log("price of token0 in val of token1 in wei " + buyToken0Wei);
    console.log("price of token1 in val of token1 in wei" + buyToken1Wei);
}

// WETH / USDC pool 0.05%  (1% = 10000, 0.3% = 3000, 0.05% = 500, 0.01 = 100)
("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 500)



//tick to Price
let price0 = (1.0001**tick)/(10**(Decimal1-Decimal0))
let price1 = 1 / price0


// sqrtPriceX96 to tick
const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));
let tick = Math.floor(Math.log((sqrtPriceX96/Q96)**2)/Math.log(1.0001));


///////////

sqrtPrice = sqrtPriceX96/2**96
price == sqrtPrice**2 == (sqrtPriceX96/2**96)**2 




/////////////  how much token (y) do they need?

// x = token0 amount
// y = token1 amount
// P = current price
// pa and pb = target price range (min and max)
// L = liquidity
// Lx = top half or range


// get top half of range
Lx = x (sqrt(P) * sqrt(pb)) / sqrt(pb) - sqrt(P)

// get price of token1 to add
y = Lx(sqrt(P) - sqrt(pa))



