const { ethers } = require('hardhat')
var bip39 = require('bip39')


const standardPath = "m/44'/60'/0'/0";
const activeIndex = 0;


function createWallet() {
  const path = `${standardPath}/${activeIndex}`;
  const phrasee = bip39.mnemonicToSeed('add')
  console.log(phrasee)
  const mnemonic = bip39.generateMnemonic()
  console.log(mnemonic)
  const account = ethers.Wallet.fromMnemonic(mnemonic, path);
  console.log(account.address)
  return account.address;
}

createWallet()