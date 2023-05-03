const exchangeContractAddress = "0xCE6A7eCEf26f43eD07A0e1F34EA132C4F797411D"; 
const vaultAddress = "0xC96370bE7400775F5887ab81089b09D3ac4FdD94"; 

const ABI_JSON_EXCHANGE = `[
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_amountToExchange",
				"type": "uint256"
			}
		],
		"name": "buyEther",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_amountToBuy",
				"type": "uint256"
			}
		],
		"name": "buyToken",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "deposit",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_percentage",
				"type": "uint256"
			}
		],
		"name": "setFeePercentage",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_tokenVault",
				"type": "address"
			}
		],
		"name": "setTokenVault",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_tokenVault",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_erc20Contract",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_tokenAmount",
				"type": "uint256"
			}
		],
		"stateMutability": "payable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "withdrawFeesAmount",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_tokenAmount",
				"type": "uint256"
			}
		],
		"name": "calculateEtherAmount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "_amount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "erc20Contract",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "feePercentage",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "feesCollected",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getExchangeRate",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "invariant",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "tokenVault",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]`;
const exchangeContractABI = JSON.parse(ABI_JSON_EXCHANGE);
const exchangeContractInstance = new ethers.Contract(exchangeContractAddress, exchangeContractABI, signer);;

const exBtnData = document.getElementById('exBtnData');
const exRate = document.getElementById('exRate');
const exEthBalance = document.getElementById('exEthBalance');
const exFeesCollected = document.getElementById('exFeesCollected');
const exVaultBalance = document.getElementById('exVaultBalance');

exBtnData.onclick = async () => {
    try {
        if (exchangeContractAddress.length === 0){
            showErrorMessages("Please, set the contract address");
        }
        else if (exchangeContractAddress.indexOf("0x") === -1 || exchangeContractAddress === "0x0"){
            showErrorMessages("Invalid contract address.");
        }
        else {
            let exchangeRate = await exchangeContractInstance.getExchangeRate();
            exRate.innerHTML = 'Exchange Rate: ' + parseEth(exchangeRate.toString());
            
            let ethBalance = await provider.getBalance(exchangeContractAddress);
            exEthBalance.innerHTML = 'Exchange ETH Balance: ' + parseEth(ethBalance.toString());

            let feesCollected = await exchangeContractInstance.feesCollected();
            exFeesCollected.innerHTML = 'Fees Collected: ' + parseEth(feesCollected.toString());

            let vaultBalance = await erc20ContractInstance.balanceOf(vaultAddress);
            exVaultBalance.innerHTML = 'Vault Token Balance: ' + parseEth(vaultBalance.toString());
        }
    } catch (error) {
        showErrorMessages("An error occured, please check the console.");
        console.log("error: " + error);
    }
}

const exBtnCheckPrice = document.getElementById('exBtnCheckPrice');
const txtAmountCheck = document.getElementById('txtAmountCheck');
const exTokenPrice = document.getElementById('exTokenPrice');

exBtnCheckPrice.onclick = async () => {
    try {
        if (exchangeContractAddress.length === 0){
            showErrorMessages("Please, set the contract address");
        }
        else if (exchangeContractAddress.indexOf("0x") === -1 || exchangeContractAddress === "0x0"){
            showErrorMessages("Invalid contract address.");
        }
        else {
            let amountCheck = txtAmountCheck.value;
            
            let price = await exchangeContractInstance.calculateEtherAmount(amountCheck);
            exTokenPrice.innerHTML = 'Value for Tokens: : ' + parseEth(price.toString());
        }
    } catch (error) {
        showErrorMessages("An error occured, please check the console.");
        console.log("error: " + error);
    }
}

const exBtnBuyToken = document.getElementById('exBtnBuyToken');
const txtAmountBuy = document.getElementById('txtAmountBuy');
const txtEthAmount = document.getElementById('txtEthAmount');

exBtnBuyToken.onclick = async () => {
    try {
        if (exchangeContractAddress.length === 0){
            showErrorMessages("Please, set the contract address");
        }
        else if (exchangeContractAddress.indexOf("0x") === -1 || exchangeContractAddress === "0x0"){
            showErrorMessages("Invalid contract address.");
        }
        else {
            let amountBuy = txtAmountBuy.value;
            let amountEth = txtEthAmount.value;
            
            await exchangeContractInstance.buyToken(amountBuy, {value: amountEth});
            showResultMessages('The operation was successful!!');
        }
    } catch (error) {
        showErrorMessages("An error occured, please check the console.");
        console.log("error: " + error);
    }
}

const exBtnSellToken = document.getElementById('exBtnSellToken');
const txtAmountSell = document.getElementById('txtAmountSell');

exBtnSellToken.onclick = async () => {
    try {
        if (exchangeContractAddress.length === 0){
            showErrorMessages("Please, set the contract address");
        }
        else if (exchangeContractAddress.indexOf("0x") === -1 || exchangeContractAddress === "0x0"){
            showErrorMessages("Invalid contract address.");
        }
        else {
            let amountSell = txtAmountSell.value;
            
            await exchangeContractInstance.buyEther(amountSell);
            showResultMessages('The operation was successful!!');
        }
    } catch (error) {
        showErrorMessages("An error occured, please check the console.");
        console.log("error: " + error);
    }
}
