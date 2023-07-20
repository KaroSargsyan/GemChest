npx hardhat compile 
npx hardhat test test/
npx hardhat run scripts/deploytestnet.js --network mumbai
npx hardhat verify _address --network mumbai _address _address

!!! Add in config file your YOUR PROVIDER URL YOUR PRIVATE KEY and ETHERSCAN API KEY

* some of test's depends on oracle price and can throw error you need manipulate the price. 

