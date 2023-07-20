/* global ethers task */
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-etherscan');
require('hardhat-contract-sizer');
// require('hardhat-gas-reporter');
// require('bip39');
// require('ethereumjs-wallet/hdkey');

``
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async () => {
    accounts = await ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

task('pub', 'Verifies the deployed contracts')
  .addParam('a1',"v45",'a3')
  .setAction(async({a1}) => {
    console.log('hi',a1);
});

task("hello", "Prints a greeting'")
  .addOptionalParam("greet", "The greeting to print", "Hello, !!!")
  .setAction(async ({ greet }) => console.log(greet));

// 

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.8.17',
  networks: {

    polygon: {
      url: "https://polygon-mainnet.infura.io/v3/a3a1ecd8690d4de5adc6e3508fa66990", //Infura url with projectId
      accounts: ["1313fd0ea9d450c6ef53c4a623efab294798eccff2bd77e5ac659da7f31a0400"] // add the account that will deploy the contract (private key)
     },

    goerli: {
      url: "https://goerli.infura.io/v3/059d3e91176d43c79354db9156588d70", //Infura url with projectId
      accounts: ["1313fd0ea9d450c6ef53c4a623efab294798eccff2bd77e5ac659da7f31a0400"] // add the account that will deploy the contract (private key)
     },
     
    sepolia: {
      url: "https://sepolia.infura.io/v3/059d3e91176d43c79354db9156588d70", //Infura url with projectId
      accounts: ["1313fd0ea9d450c6ef53c4a623efab294798eccff2bd77e5ac659da7f31a0400"] // add the account that will deploy the contract (private key)
     },
    
     // url: "https://polygon-mumbai.g.alchemy.com/v2/MaJZLENiP-6O9m-2T_mCQrogS4FZYxSD",
    mumbai: {
      url: "https://magical-crimson-dew.matic-testnet.discover.quiknode.pro/e6401f993f251765a7f751bba4e1b03babaee836/",
      accounts: ["1313fd0ea9d450c6ef53c4a623efab294798eccff2bd77e5ac659da7f31a0400"]
    },

    arbitrum: {
      // url: "https://arb-mainnet.g.alchemy.com/v2/8rRW61U1s1AuBwwIQDS4QhDSdpoG4aFt",
      url: "https://arbitrum-mainnet.infura.io/v3/94fb3c194f2b4b85bf6bae526ce5d12b",
      accounts: ["1313fd0ea9d450c6ef53c4a623efab294798eccff2bd77e5ac659da7f31a0400"]
    },

    optimism:{
      url: "https://opt-mainnet.g.alchemy.com/v2/plUHWCE55bZKDNA28C2tuqeo7fbp4A_4",
      accounts: ["1313fd0ea9d450c6ef53c4a623efab294798eccff2bd77e5ac659da7f31a0400"]

    },
    
     hardhat: {
       forking: {
        // url: "https://arb-mainnet.g.alchemy.com/v2/8rRW61U1s1AuBwwIQDS4QhDSdpoG4aFt",
        // url: "https://eth-mainnet.alchemyapi.io/v2/zSLEylkSYyz9hEvQcJBbdDq7Hk35HqAG",
        // url: "https://opt-mainnet.g.alchemy.com/v2/plUHWCE55bZKDNA28C2tuqeo7fbp4A_4",
        url:"https://polygon-mainnet.g.alchemy.com/v2/sndQ3NBa580obcwdt8HBfa49hfClE0LE",
        // blockNumber: 20005467

     },
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    // apiKey: "Q5B4EZFKMKX98FJNP594H1HGC3MS6XZJ9N"
    apiKey: "S9HY7WFT585N5ECZ6IY9ID6AX211F9EDQQ" // ARB
  },
  gasReporter: {
    enabled: true,
    noColors: true,
    currency: "USD",
    coinmarketcap:"6680ce3f-d003-42e4-bc29-d3af090c67a6", 
    token:"MATIC",
  },
}