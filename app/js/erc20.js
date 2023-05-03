const contractAddress = "0xDf1bB6f75d6Afb6F5a573a026E6C0Ab92BB3ff32"; 

const ABI_JSON = `[
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_symbol",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_maxSupply",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "_spender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "_from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "_to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "allowance",
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
      "inputs": [
        {
          "internalType": "address",
          "name": "_spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "balanceOf",
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
      "name": "decimals",
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
      "name": "maxSupply",
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
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
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
      "inputs": [
        {
          "internalType": "address",
          "name": "_to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]`;
const contractABI = JSON.parse(ABI_JSON);
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const erc20ContractInstance = new ethers.Contract(contractAddress, contractABI, signer);

const accountAddress = document.getElementById('accountAddress');
const accountBalance = document.getElementById('accountBalance');
const accountTokenBalance = document.getElementById('accountTokenBalance');
const connectButton = document.getElementById('connectButton');

connectButton.onclick = async () => {
    try {
        if (contractAddress.length === 0){
            showErrorMessages("Please, set the contract address");
        }
        else if (contractAddress.indexOf("0x") === -1 || contractAddress === "0x0"){
            showErrorMessages("Invalid contract address.");
        }
        else {            
            //opens the metamask wallet
            await ethereum.request({ method: 'eth_requestAccounts' });

            accountAddress.innerHTML = 'Account: ' + (await signer.getAddress());
            let str = await provider.getBalance(await signer.getAddress());
            
            accountBalance.innerHTML = 'ETH Balance: ' + parseEth(str.toString());

            let tokBalance = await erc20ContractInstance.balanceOf(await signer.getAddress());
            
            accountTokenBalance.innerHTML = 'Token Balance: ' + parseEth(tokBalance.toString());
        }
    } catch (error) {
        showErrorMessages("An error occured, please check the console.");
        console.log("error: " + error);
    }
}

const txtAllowAccount = document.getElementById('txtAllowAccount');
const txtAllowValue = document.getElementById('txtAllowValue');
const allowButton = document.getElementById('allowButton');

allowButton.onclick = async () => {
    try {
        if (contractAddress.length === 0){
            showErrorMessages("Please, set the contract address");
        }
        else if (contractAddress.indexOf("0x") === -1 || contractAddress === "0x0"){
            showErrorMessages("Invalid contract address.");
        }
        else {
            if(txtAllowAccount.value === '' || txtAllowValue.value === ''){
                showErrorMessages("Complete fields first.");
            } else {
                await erc20ContractInstance.approve(txtAllowAccount.value, txtAllowValue.value);
                showResultMessages('Approved OK');
            }
        }
    } catch (error) {
        showErrorMessages("An error occured, please check the console.");
        console.log("error: " + error);
    }
}

const txtBalanceAccount = document.getElementById('txtBalanceAccount');
const lblBalanceBalance = document.getElementById('lblBalanceBalance');
const getBalanceButton = document.getElementById('getBalanceButton');

getBalanceButton.onclick = async () => {
    try {
        if (contractAddress.length === 0){
            showErrorMessages("Please, set the contract address");
        }
        else if (contractAddress.indexOf("0x") === -1 || contractAddress === "0x0"){
            showErrorMessages("Invalid contract address.");
        }
        else {
            if(txtBalanceAccount.value === ''){
                showErrorMessages("Complete fields first.");
            } else {
                let balance = await erc20ContractInstance.balanceOf(txtBalanceAccount.value);
                lblBalanceBalance.innerHTML = 'Token Balance: ' + balance;
            }
        }
    } catch (error) {
        showErrorMessages("An error occured, please check the console.");
        console.log("error: " + error);
    }
}

filter = {
  address: contractAddress,
  topics: [
      ethers.utils.id("Transfer(address,address,uint256)"),
  ]
}
provider.on(filter, () => {
    showResultMessages('Transfer event occurred!!');
});