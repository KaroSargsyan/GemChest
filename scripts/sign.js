const { ethers } = require('hardhat')

async function signMessage () {
    // const accounts = await ethers.getSigners()
    // const signer = accounts[0]

    const privateKey = "86c62ec161c649b9be63927ec0ea1582922cf64b8db15343976105074df9b928";
    const signer = new ethers.Wallet(privateKey);

    let message='hello'
    let messageHash = ethers.utils.id(message);
    let messageHashBytes = ethers.utils.arrayify(messageHash)  
    let signature = await signer.signMessage(messageHashBytes)

    console.log('signer.address',signer.address)
    // console.log("--------------------------------------------------")
    console.log(message)
    console.log('Signature',signature)
}

signMessage()

