const { ethers } = require("hardhat");
require('dotenv').config();
const { getContractAddress } = require('@ethersproject/address');

const ERC20_CONTRACT_NAME = "ERC20";
const EXCHANGE_CONTRACT_NAME = "Exchange";
const VAULT_ADDRESS = process.env.VAULT_ADDRESS;
const confirmations_number  =  1;

async function main() {

    console.log("---------------------------------------------------------------------------------------");
    console.log("-- Deploy contracts process start...");
    console.log("---------------------------------------------------------------------------------------");
    
    [signer] = await ethers.getSigners();
    provider = ethers.provider;

    const _name = "TT2 Token ERC20";
    const _symbol = "TT2";
    const _maxSupply = ethers.utils.parseEther("1000");
    
    const contractFactory = await ethers.getContractFactory(ERC20_CONTRACT_NAME);
    const erc20Contract = await contractFactory.deploy(_name, _symbol, _maxSupply);

    console.log("-- ERC20 Contract Address:\t", erc20Contract.address);

    // Transfiero 100 tokens al vault
    const _transferAmmount = ethers.utils.parseEther("100");
    const _transferEth = ethers.utils.parseEther("0.5");
    const tx = await erc20Contract.transfer(VAULT_ADDRESS, _transferAmmount);

    tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
    if(tx_result.confirmations < 0 || tx_result === undefined) {
        throw new Error("Transaction failed");
    }
    // Verifico address del nuevo contrato
    const transactionCount = await signer.getTransactionCount();

    const futureAddress = await getContractAddress({
        from: signer.address,
        nonce: (transactionCount + 1)
    });

    const tx1 = await erc20Contract.approve(futureAddress, _transferAmmount);

    tx1_result = await provider.waitForTransaction(tx1.hash, confirmations_number);
    if(tx1_result.confirmations < 0 || tx1_result === undefined) {
        throw new Error("Transaction failed");
    }
    
    const contractFactoryExchange = await ethers.getContractFactory(EXCHANGE_CONTRACT_NAME);
    const exchangeContract = await contractFactoryExchange.deploy(VAULT_ADDRESS, erc20Contract.address, _transferAmmount, {value: _transferEth});
    
    console.log("-- Exchange Contract Address:\t", exchangeContract.address);

    console.log("---------------------------------------------------------------------------------------");
    console.log("-- Contracts have been successfully deployed");
    console.log("---------------------------------------------------------------------------------------");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });