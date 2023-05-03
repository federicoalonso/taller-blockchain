const { ethers } = require("hardhat");

const chai = require("chai");
const { solidity } = require( "ethereum-waffle");
const { getContractAddress } = require('@ethersproject/address');
chai.use(solidity);
const { expect } = chai;

const contractPathERC20 = "contracts/ERC20.sol:ERC20";
const contractPathExchange = "contracts/Exchange.sol:Exchange";
const confirmations_number  =  1;
const zeroAddress = '0x0000000000000000000000000000000000000000';
let contractInstanceERC20;
const bigNumber = 1000000000000000000;

// Constructor parameters
const nameERC20 = "MyERC-20_Token";
const symbol = "PCIB";
const maxSupply = ethers.utils.parseEther("1000");

describe("Contracts tests", () => {
    before(async () => {
        console.log("-----------------------------------------------------------------------------------");
        console.log(" -- Contracts tests start");
        console.log("-----------------------------------------------------------------------------------");

        // Get Signer and provider
        [signer, account1, account2, account3] = await ethers.getSigners();
        provider = ethers.provider;

        // Deploy ERC20 contract
        const contractFactoryERC20 = await ethers.getContractFactory(contractPathERC20, signer);
        contractInstanceERC20 = await contractFactoryERC20.deploy(nameERC20, symbol, maxSupply);
    });

    describe("ERC-20 tests", () => {

        describe("Constructor tests", () => {
            it("Try send empty name", async () => {
                const contractFactory = await ethers.getContractFactory(contractPathERC20, signer);
                await expect(contractFactory.deploy("", "", 0)).to.be.revertedWith("constructor - Invalid parameter: _name");
            });

            it("Try send empty symbol", async () => {
                const contractFactory = await ethers.getContractFactory(contractPathERC20, signer);
                await expect(contractFactory.deploy("Test", "", 0)).to.be.revertedWith("constructor - Invalid parameter: _symbol");
            });

            it("Try send 0 _maxSupply", async () => {
                const contractFactory = await ethers.getContractFactory(contractPathERC20, signer);
                await expect(contractFactory.deploy("Test", "Test", 0)).to.be.revertedWith("constructor - Max supply should be positive");
            });

            it("Initialization test", async () => {
                const receivedNameERC20 = await contractInstanceERC20.name();
                const receivedSymbol = await contractInstanceERC20.symbol();
                const receivedMaxSupply = await contractInstanceERC20.maxSupply();
                const receivedDecimals = await contractInstanceERC20.decimals();
                const totalSupply = await contractInstanceERC20.totalSupply();
                const signerBalance = await contractInstanceERC20.balanceOf(signer.address);

                expect(receivedNameERC20).to.be.equals(nameERC20);
                expect(receivedSymbol).to.be.equals(symbol);
                expect(receivedMaxSupply).to.be.equals(maxSupply);
                expect(totalSupply).to.be.equals(maxSupply);
                expect(receivedDecimals).to.be.equals(18);
                expect(signerBalance).to.be.equals(maxSupply);
            });
        });

        describe("Transfer tests", () => {
            it("Try transfer to zero address", async () => {
                const amountToTransfer = ethers.utils.parseEther("1");
                await expect(contractInstanceERC20.transfer(zeroAddress, amountToTransfer)).to.be.revertedWith("transfer - Invalid parameter: _to");
            });

            it("Try transfer zero amount", async () => {
                const amountToTransfer = ethers.utils.parseEther("0");
                await expect(contractInstanceERC20.transfer(account1.address, amountToTransfer)).to.be.revertedWith("transfer - Invalid parameter: _value");
            });

            it("Try transfer to the same account", async () => {
                const amountToTransfer = ethers.utils.parseEther("1");
                await expect(contractInstanceERC20.transfer(signer.address, amountToTransfer)).to.be.revertedWith("transfer - Invalid recipient, same as remittent");
            });

            it("Try transfer with insufficient balance", async () => {
                const amountToTransfer = ethers.utils.parseEther("1");
                const newInstance = await contractInstanceERC20.connect(account1);
                await expect(newInstance.transfer(account2.address, amountToTransfer)).to.be.revertedWith("transfer - Insufficient balance");
            });

            it("Transfer 100 tokens to account2", async () => {
                const signerBalanceBefore = await contractInstanceERC20.balanceOf(signer.address);
                const account2BalanceBefore = await contractInstanceERC20.balanceOf(account2.address);
                
                const amountToTransfer = ethers.utils.parseEther("100");
                const tx = await contractInstanceERC20.transfer(account2.address, amountToTransfer);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check balance
                const signerBalanceAfter = await contractInstanceERC20.balanceOf(signer.address);
                const account2BalanceAfter = await contractInstanceERC20.balanceOf(account2.address);
                expect(parseInt(signerBalanceAfter)).to.be.lessThanOrEqual(parseInt(signerBalanceBefore) - parseInt(amountToTransfer));
                expect(parseInt(account2BalanceAfter)).to.be.equals(parseInt(account2BalanceBefore) + parseInt(amountToTransfer));


                // Check event emitted
                const eventSignature = "Transfer(address,address,uint256)";
                const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));

                 // Receipt information
                const eventSignatureHashReceived = tx_result.logs[0].topics[0];              
                const eventFromParameterReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
                const eventToParameterReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[2])[0];
                const eventValueParameterReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

                //check event signature
                expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
                //check event _from parameter
                expect(eventFromParameterReceived).to.be.equals(signer.address);
                //check event _to parameter
                expect(eventToParameterReceived).to.be.equals(account2.address);
                //check event _value parameter
                expect(eventValueParameterReceived).to.be.equals(amountToTransfer);

            });
        });

        describe("Approve tests", () => {
            it("Try approve to zero address", async () => {
                const amountToApprove = ethers.utils.parseEther("1");
                await expect(contractInstanceERC20.approve(zeroAddress, amountToApprove)).to.be.revertedWith("approve - Invalid parameter: _spender");
            });

            it("Try approve with insufficient balance", async () => {
                const amountToApprove = ethers.utils.parseEther("2000");
                await expect(contractInstanceERC20.approve(account1.address, amountToApprove)).to.be.revertedWith("approve - Insufficient balance");
            });

            it("Set approve for 10 tokens", async () => {
                const amountToApprove = ethers.utils.parseEther("10");
                const tx = await contractInstanceERC20.approve(account1.address, amountToApprove);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check result
                const amountApproved = await contractInstanceERC20.allowance(signer.address, account1.address);
                expect(amountApproved).to.be.equals(amountToApprove);


                // Check event emitted
                const eventSignature = "Approval(address,address,uint256)";
                const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));

                // Receipt information
                const eventSignatureHashReceived = tx_result.logs[0].topics[0];
                const eventOwnerParameterReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
                const eventSpenderParameterReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[2])[0];
                const eventValueParameterReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

                //check event signature
                expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
                //check event _owner parameter 
                expect(eventOwnerParameterReceived).to.be.equals(signer.address);
                //check event _spender parameter
                expect(eventSpenderParameterReceived).to.be.equals(account1.address);
                //check event _value parameter
                expect(eventValueParameterReceived).to.be.equals(amountToApprove);

            });

            it("Try approve to the same account same amount", async () => {
                const amountToApprove = ethers.utils.parseEther("10");
                await expect(contractInstanceERC20.approve(account1.address, amountToApprove)).to.be.revertedWith("approve - Invalid allowance amount. Set to zero first");
            });

            it("Try approve to the same account different amount", async () => {
                const amountToApprove = ethers.utils.parseEther("20");
                await expect(contractInstanceERC20.approve(account1.address, amountToApprove)).to.be.revertedWith("approve - Invalid allowance amount. Set to zero first");
            });

            it("Set approve for zero amount", async () => {
                const amountToApprove = ethers.utils.parseEther("0");
                const tx = await contractInstanceERC20.approve(account1.address, amountToApprove);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check result
                const amountApproved = await contractInstanceERC20.allowance(signer.address, account1.address);
                expect(amountApproved).to.be.equals(amountToApprove);


                // Check event emitted
                const eventSignature = "Approval(address,address,uint256)";
                const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));
                
                // Receipt information
                const eventSignatureHashReceived = tx_result.logs[0].topics[0];
                const eventOwnerParameterReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
                const eventSpenderParameterReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[2])[0];
                const eventValueParameterReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

                //check event signature
                expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
                //check event _owner parameter
                expect(eventOwnerParameterReceived).to.be.equals(signer.address);
                //check event _spender parameter
                expect(eventSpenderParameterReceived).to.be.equals(account1.address);
                //check event _value parameter
                expect(eventValueParameterReceived).to.be.equals(amountToApprove);

            });

            it("Set approve for 20 tokens to account1", async () => {
                const amountToApprove = ethers.utils.parseEther("20");
                const tx = await contractInstanceERC20.approve(account1.address, amountToApprove);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check result
                const amountApproved = await contractInstanceERC20.allowance(signer.address, account1.address);
                expect(amountApproved).to.be.equals(amountToApprove);


                // Check event emitted
                const eventSignature = "Approval(address,address,uint256)";
                const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));

                // Receipt information
                const eventSignatureHashReceived = tx_result.logs[0].topics[0];
                const eventOwnerParameterReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
                const eventSpenderParameterReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[2])[0];
                const eventValueParameterReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

                //check event signature
                expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
                //check event _owner parameter
                expect(eventOwnerParameterReceived).to.be.equals(signer.address);
                //check event _spender parameter
                expect(eventSpenderParameterReceived).to.be.equals(account1.address);
                //check event _value parameter
                expect(eventValueParameterReceived).to.be.equals(amountToApprove);

            });
        });

        describe("TransferFrom tests", () => {
            it("Try TransferFrom from zero address", async () => {
                const amountToTransfer = ethers.utils.parseEther("1");
                await expect(contractInstanceERC20.transferFrom(zeroAddress, signer.address, amountToTransfer)).to.be.revertedWith("transferFrom - Invalid parameter: _from");
            });
            
            it("Try TransferFrom to zero address", async () => {
                const amountToTransfer = ethers.utils.parseEther("1");
                await expect(contractInstanceERC20.transferFrom(signer.address, zeroAddress, amountToTransfer)).to.be.revertedWith("transferFrom - Invalid parameter: _to");
            });

            it("Try TransferFrom zero amount", async () => {
                const amountToTransfer = ethers.utils.parseEther("0");
                await expect(contractInstanceERC20.transferFrom(signer.address, account1.address, amountToTransfer)).to.be.revertedWith("transferFrom - Invalid parameter: _value");
            });

            it("Try TransferFrom to the same account", async () => {
                const amountToTransfer = ethers.utils.parseEther("1");
                await expect(contractInstanceERC20.transferFrom(signer.address, signer.address, amountToTransfer)).to.be.revertedWith("transferFrom - Invalid recipient, same as remittent");
            });

            it("Try TransferFrom with insufficient balance", async () => {
                const amountToTransfer = ethers.utils.parseEther("2000");
                await expect(contractInstanceERC20.transferFrom(account2.address, signer.address, amountToTransfer)).to.be.revertedWith("transferFrom - Insufficient balance");
            });
            
            it("Try TransferFrom with no allowance", async () => {
                const amountToTransfer = ethers.utils.parseEther("1");
                await expect(contractInstanceERC20.transferFrom(account2.address, signer.address, amountToTransfer)).to.be.revertedWith("transferFrom - Insufficient allowance");
            });

            it("Try TransferFrom with insufficient allowance", async () => {
                const amountToTransfer = ethers.utils.parseEther("30");
                const newInstance = await contractInstanceERC20.connect(account1);
                await expect(newInstance.transferFrom(signer.address, account1.address, amountToTransfer)).to.be.revertedWith("transferFrom - Insufficient allowance");
            });        

            it("TransferFrom 10 tokens from signer to account1 account", async () => {
                const signerBalanceBefore = await contractInstanceERC20.balanceOf(signer.address);
                const account1BalanceBefore = await contractInstanceERC20.balanceOf(account1.address);
                
                const amountToTransfer = ethers.utils.parseEther("10");
                const tx = await contractInstanceERC20.transferFrom(signer.address, account1.address, amountToTransfer);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check balance
                const signerBalanceAfter = await contractInstanceERC20.balanceOf(signer.address);
                const account1BalanceAfter = await contractInstanceERC20.balanceOf(account1.address);
                expect(parseInt(signerBalanceAfter)).to.be.lessThanOrEqual(parseInt(signerBalanceBefore) - parseInt(amountToTransfer));
                expect(parseInt(account1BalanceAfter)).to.be.equals(parseInt(account1BalanceBefore) + parseInt(amountToTransfer));


                // check event emitted
                const eventSignature = "Transfer(address,address,uint256)";
                const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));

                // Receipt information
                const eventSignatureHashReceived = tx_result.logs[0].topics[0];
                const eventFromParameterReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[1])[0];
                const eventToParameterReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx_result.logs[0].topics[2])[0];
                const eventValueParameterReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx_result.logs[0].data)[0];

                //check event signature
                expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
                //check event _from parameter
                expect(eventFromParameterReceived).to.be.equals(signer.address);
                //check event _to parameter
                expect(eventToParameterReceived).to.be.equals(account1.address);
                //check event _value parameter
                expect(eventValueParameterReceived).to.be.equals(amountToTransfer);

            });

            it("TransferFrom signer to account1 with account3 signer", async () => {
                const signerBalanceBefore = await contractInstanceERC20.balanceOf(signer.address);
                const account1BalanceBefore = await contractInstanceERC20.balanceOf(account1.address);
                
                const amountToTransfer = ethers.utils.parseEther("10");

                const tx = await contractInstanceERC20.approve(account3.address, amountToTransfer);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                const newInstance = await contractInstanceERC20.connect(account3);

                const tx2 = await newInstance.transferFrom(signer.address, account1.address, amountToTransfer);

                tx2_result = await provider.waitForTransaction(tx2.hash, confirmations_number);
                if(tx2_result.confirmations < 0 || tx2_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check balance
                const signerBalanceAfter = await contractInstanceERC20.balanceOf(signer.address);
                const account1BalanceAfter = await contractInstanceERC20.balanceOf(account1.address);
                const approved = await contractInstanceERC20.allowance(signer.address, account3.address);
                expect(parseInt(signerBalanceAfter)).to.be.lessThanOrEqual(parseInt(signerBalanceBefore) - parseInt(amountToTransfer));
                expect(parseInt(account1BalanceAfter)).to.be.equals(parseInt(account1BalanceBefore) + parseInt(amountToTransfer));
                expect(parseInt(approved)).to.be.equals(0);


                // check event emitted
                const eventSignature = "Transfer(address,address,uint256)";
                const eventSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSignature));

                // Receipt information
                const eventSignatureHashReceived = tx2_result.logs[0].topics[0];
                const eventFromParameterReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx2_result.logs[0].topics[1])[0];
                const eventToParameterReceived = ethers.utils.defaultAbiCoder.decode(['address'], tx2_result.logs[0].topics[2])[0];
                const eventValueParameterReceived = ethers.utils.defaultAbiCoder.decode(['uint256'], tx2_result.logs[0].data)[0];

                //check event signature
                expect(eventSignatureHashReceived).to.be.equals(eventSignatureHash);
                //check event _from parameter
                expect(eventFromParameterReceived).to.be.equals(signer.address);
                //check event _to parameter
                expect(eventToParameterReceived).to.be.equals(account1.address);
                //check event _value parameter
                expect(eventValueParameterReceived).to.be.equals(amountToTransfer);

            });
        });
        
        describe("Transfer to owner Tokens", () => {     
            it("Transfer all tokens from account1 to signer account", async () => {
                const amountToTransfer1 = ethers.utils.parseEther("20");
                const newInstance = await contractInstanceERC20.connect(account1);
                const tx1 = await newInstance.transfer(signer.address, amountToTransfer1);

                tx1_result = await provider.waitForTransaction(tx1.hash, confirmations_number);
                if(tx1_result.confirmations < 0 || tx1_result === undefined) {
                    throw new Error("Transaction failed");
                }

                const signerBalance = await contractInstanceERC20.balanceOf(signer.address);
                const account1Balance = await contractInstanceERC20.balanceOf(account1.address);
                
                expect(parseInt(signerBalance)).to.be.lessThanOrEqual(parseInt(maxSupply));
                expect(parseInt(account1Balance)).to.be.equals(parseInt(ethers.utils.parseEther("0")));

            });
        });
    });

    /// --------------------------------------------------------------------------------------------------------------
    /// Exchange Test
    /// --------------------------------------------------------------------------------------------------------------

    // Constructor Exchange parameters
    const ethAmount = ethers.utils.parseEther("20");
    const tokenAmount = ethers.utils.parseEther("100");

    describe("Exchange tests", () => {
        before(async () => {
            console.log("-----------------------------------------------------------------------------------");
            console.log(" -- Exchanger tests start");
            console.log("-----------------------------------------------------------------------------------");
            
            const transactionCount = await signer.getTransactionCount();

            const futureAddress = await getContractAddress({
                from: signer.address,
                nonce: (transactionCount + 1)
            });

            const tx = await contractInstanceERC20.approve(futureAddress, tokenAmount);

            tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
            if(tx_result.confirmations < 0 || tx_result === undefined) {
                throw new Error("Transaction failed");
            }
            
            const contractFactoryExchange = await ethers.getContractFactory(contractPathExchange, signer);
            contractInstanceExchange = await contractFactoryExchange.deploy(account2.address, contractInstanceERC20.address, tokenAmount, {value: ethAmount});

            const newInstance = await contractInstanceERC20.connect(account2);
            const tx1 = await newInstance.approve(contractInstanceExchange.address, tokenAmount);

            tx1_result = await provider.waitForTransaction(tx1.hash, confirmations_number);
            if(tx1_result.confirmations < 0 || tx1_result === undefined) {
                throw new Error("Transaction failed");
            }
        });

        describe("Constructor", () => {

            /* Check deploy*/
            it("Try send invalid address for tokenVault", async () => {
                const contractFactoryExchange = await ethers.getContractFactory(contractPathExchange, signer);
                await expect(contractFactoryExchange.deploy(zeroAddress, contractInstanceERC20.address, 1)).to.be.revertedWith("Invalid address _tokenVault");
            });

             it("Try send token vault as contract", async () => {
                 const contractFactoryExchange = await ethers.getContractFactory(contractPathExchange, signer);
                 await expect(contractFactoryExchange.deploy(contractInstanceERC20.address,contractInstanceERC20.address, 1)).to.be.revertedWith("_tokenVault cannot be a contract");
            });

            it("Try send 0 _maxSupply", async () => {
                const contractFactoryExchange = await ethers.getContractFactory(contractPathExchange, signer);
                await expect(contractFactoryExchange.deploy(account1.address, zeroAddress, 1)).to.be.revertedWith("_erc20Contract cannot be zero address");
            });

            it("Try send account address for erc20Contract", async () => {
                const contractFactoryExchange = await ethers.getContractFactory(contractPathExchange, signer);
                await expect(contractFactoryExchange.deploy(account1.address, account1.address, 1)).to.be.revertedWith("_erc20Contract is not a contract");
            });

            it("Try send invalid token amount", async () => {
                const contractFactoryExchange = await ethers.getContractFactory(contractPathExchange, signer);
                await expect(contractFactoryExchange.deploy(account1.address, contractInstanceERC20.address, 0)).to.be.revertedWith("Invalid _tokenAmount value");
            });

            it("Try send invalid eth amount", async () => {
                const contractFactoryExchange = await ethers.getContractFactory(contractPathExchange, signer);
                await expect(contractFactoryExchange.deploy(account1.address, contractInstanceERC20.address, 1, {value: 0})).to.be.revertedWith("Invalid ether value");
            });

            it("Token Vault with not enough balance", async () => {
                const contractFactoryExchange = await ethers.getContractFactory(contractPathExchange, signer);
                await expect(contractFactoryExchange.deploy(account1.address, contractInstanceERC20.address, 1, {value: 1})).to.be.revertedWith("Insufficient tokens in the vault");
            });

            /* Check constructor values*/
            it("Initialization decimals", async () => {
                const receivedDecimals = await contractInstanceExchange.decimals();
                expect(receivedDecimals).to.be.equals(18);
            });

            it("Initialization feePercentage", async () => {
                let receivedFeePercentage = await contractInstanceExchange.feePercentage();
                let etherAmountExpected = ethers.utils.parseEther("3");
                let expectedFeePercentage = etherAmountExpected.div(100);
                expect(receivedFeePercentage).to.be.equals(expectedFeePercentage);
            });

            it("Initialization tokenVault", async () => {
                const receivedTokenVault = await contractInstanceExchange.tokenVault();
                expect(receivedTokenVault).to.be.equals(account2.address);
            });

            it("Initialization contract", async () => {
                const receivedERC20Contract = await contractInstanceExchange.erc20Contract();
                expect(receivedERC20Contract).to.be.equals(contractInstanceERC20.address);
            });

            it("Initialization owner", async () => {
                const receivedOwner = await contractInstanceExchange.owner();
                expect(receivedOwner).to.be.equals(signer.address);
            });
            
            it("Initialization invariant", async () => {
                const receivedInvariant = await contractInstanceExchange.invariant();
                let expectedInvariant = ethAmount * tokenAmount * 2 / bigNumber;
                expect(receivedInvariant / bigNumber).to.be.equals(expectedInvariant);
            });
        });
         
        describe("CalculateEtherAmount", () => {    
            it("_tokenAmount must be greater than zero", async () => {
                await expect(contractInstanceExchange.calculateEtherAmount(0)).to.be.revertedWith("Invalid _tokenAmount value");
            });

            it("Should return the correct amount of ether", async () => {
                let testAmount = ethers.utils.parseEther("5");
                let eth_antes = 20;
                let tok_antes = 200;
                let inv = eth_antes * tok_antes;

                let expectedAmount = (inv / (tok_antes - 5)) - eth_antes;
                let amount = (await contractInstanceExchange.calculateEtherAmount(testAmount)) / bigNumber;
                
                expect(amount).to.be.approximately(expectedAmount, 0.00000000000002);
            });
        });

        describe("getExchangeRate", () => {
            it("Should return the correct exchange rate", async () => {
                let eth_antes = 20;
                let tok_antes = 200;
                let inv = eth_antes * tok_antes;

                let expectedAmount = tok_antes - (inv / (eth_antes + 1));
                let amount = (await contractInstanceExchange.getExchangeRate()) / bigNumber;
                
                expect(amount).to.be.approximately(expectedAmount, 0.00000000000002);
            });
        });
            
        describe("buyToken", () => {
            it("Should revert if the amount of ether is zero", async () => {
                await expect(contractInstanceExchange.buyToken(0)).to.be.revertedWith("Invalid _amountToBuy value");
            });

            it("Should revert if the amount of ether plus commission is insufficient", async () => {
                let testAmount = ethers.utils.parseEther("5");
                await expect(contractInstanceExchange.buyToken(testAmount)).to.be.revertedWith("Insufficient ethers");
            });

            it("should return the correct amount of tokens", async () => {
                const signerBalanceBefore = await contractInstanceERC20.balanceOf(account3.address);
                const vaultBalanceBefore = await contractInstanceERC20.balanceOf(account2.address);
                const account3BalanceBefore = await provider.getBalance(account3.address);
                const contractBalanceBefore = await provider.getBalance(contractInstanceExchange.address);

                let ethAmount = ethers.utils.parseEther("1");
                let testAmount = ethers.utils.parseEther("5");
                let eth_antes = 20;
                let tok_antes = 200;
                let inv = eth_antes * tok_antes;

                let costo = (inv / (tok_antes - 5)) - eth_antes;
                let fee = costo * 3 / 100;
                let total_int = costo + fee;
                let total = ethers.utils.parseEther(total_int.toString());

                const newInstance = await contractInstanceExchange.connect(account3);
                const tx1 = await newInstance.buyToken(testAmount, {value: ethAmount});

                tx1_result = await provider.waitForTransaction(tx1.hash, confirmations_number);
                if(tx1_result.confirmations < 0 || tx1_result === undefined) {
                    throw new Error("Transaction failed");
                }
                
                // Check balance
                const signerBalanceAfter = await contractInstanceERC20.balanceOf(account3.address);
                const vaultBalanceAfter = await contractInstanceERC20.balanceOf(account2.address);
                const account3BalanceAfter = await provider.getBalance(account3.address);
                const contractBalanceAfter = await provider.getBalance(contractInstanceExchange.address);
                const contractFeesCollected = await contractInstanceExchange.feesCollected();

                expect(parseInt(signerBalanceAfter)).to.be.equals(parseInt(signerBalanceBefore) + parseInt(testAmount));
                expect(parseInt(vaultBalanceAfter)).to.be.equals(parseInt(vaultBalanceBefore) - parseInt(testAmount));

                let dif_acc3 = (parseInt(account3BalanceBefore) - parseInt(total)) / bigNumber;
                expect(parseInt(account3BalanceAfter) / bigNumber).to.be.approximately(dif_acc3, 0.001);
                expect(parseInt(contractBalanceAfter)).to.be.approximately(parseInt(contractBalanceBefore) + parseInt(total), parseInt(ethers.utils.parseEther('0.001')));
                expect(parseInt(contractFeesCollected)).to.be.approximately(parseInt(ethers.utils.parseEther(fee.toString())), parseInt(ethers.utils.parseEther('0.0001')));
                
            });
        });

        describe("buyEther", () => {
            it("Should revert if balance of sender is insufficient", async () => {
                let amountToSell = ethers.utils.parseEther('10');
                await expect(contractInstanceExchange.connect(account3).buyEther(amountToSell)).to.be.revertedWith("Insufficient balance");
            });
            
            it("Should revert if the amount of tokens is zero or less", async () => {
                await expect(contractInstanceExchange.buyEther(0)).to.be.revertedWith("Invalid _amountToExchange value");
            });
            
            it("should return the correct amount of ether", async () => {
                let amountToSell = ethers.utils.parseEther('5');
                const tx = await contractInstanceERC20.connect(account3).approve(contractInstanceExchange.address, amountToSell);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }
                
                // Balances Before
                const account3BalanceBefore = await provider.getBalance(account3.address);
                const contractBalanceBefore = await provider.getBalance(contractInstanceExchange.address);
                const feesCollectedBefore = await contractInstanceExchange.feesCollected();
                const vaultBalanceBefore = await contractInstanceERC20.balanceOf(account2.address);

                const invariantBefore = (parseFloat(vaultBalanceBefore)) * ((parseFloat(contractBalanceBefore)) - (parseFloat(feesCollectedBefore)));

                // Transaction
                const tx1 = await contractInstanceExchange.connect(account3).buyEther(amountToSell);

                tx1_result = await provider.waitForTransaction(tx1.hash, confirmations_number);
                if(tx1_result.confirmations < 0 || tx1_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Balances After
                const account3BalanceAfter = await provider.getBalance(account3.address);
                const contractBalanceAfter = await provider.getBalance(contractInstanceExchange.address);
                const feesCollectedAfter = await contractInstanceExchange.feesCollected();
                const vaultBalanceAfter = await contractInstanceERC20.balanceOf(account2.address);

                const invariantAfter = (parseFloat(vaultBalanceAfter)) * ((parseFloat(contractBalanceAfter)) - (parseFloat(feesCollectedAfter)));

                // Check
                expect(parseInt(account3BalanceAfter)).to.be.greaterThan(parseInt(account3BalanceBefore));
                expect(parseInt(vaultBalanceAfter)).to.be.equals(parseInt(vaultBalanceBefore) + parseInt(amountToSell));
                expect(invariantAfter).to.be.equals(invariantBefore);
            });
        });

        describe("setFeePercentage", () => {
            it("Should revert if not the owner", async () => {
                await expect(contractInstanceExchange.connect(account1).setFeePercentage(1)).to.be.revertedWith("Not authorized");
            });

            it("Should revert if `_percentage` is fewer than zero.", async () => {
                await expect(contractInstanceExchange.setFeePercentage(0)).to.be.revertedWith("Invalid _feePercentage value");
            });

            it("should set the correct fee percentage", async () => {
                let newFeePercentage = ethers.utils.parseEther('1');
                await contractInstanceExchange.setFeePercentage(newFeePercentage);
                let contractPercentage = await contractInstanceExchange.feePercentage();
                expect(contractPercentage).to.be.equal(newFeePercentage);
            });
        });

        describe("deposit", () => {
            it("Should revert if not the owner", async () => {
                await expect(contractInstanceExchange.connect(account1).deposit({value: 1})).to.be.revertedWith("Not authorized");
            });

            it("Should revert if the amount of ether is zero", async () => {
                let transactionValue = ethers.utils.parseEther('0');
                await expect(contractInstanceExchange.deposit({value: transactionValue})).to.be.revertedWith("No ethers deposited");
            });

            it("Should revert if the owner account has insufficient amount of tokens.", async () => {
                let transactionValue = ethers.utils.parseEther('905');
                const amountToTransfer = ethers.utils.parseEther("750");
                const tx = await contractInstanceERC20.transfer(account3.address, amountToTransfer);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }
                await expect(contractInstanceExchange.deposit({value: transactionValue})).to.be.revertedWith("Insufficient balance");

                const tx1 = await contractInstanceERC20.connect(account3).transfer(signer.address, amountToTransfer);

                tx1_result = await provider.waitForTransaction(tx1.hash, confirmations_number);
                if(tx1_result.confirmations < 0 || tx1_result === undefined) {
                    throw new Error("Transaction failed");
                }
            });

            it("should change the invariant and balances", async () => {
                // Balances Before
                const contractBalanceBefore = await provider.getBalance(contractInstanceExchange.address);
                const feesCollectedBefore = await contractInstanceExchange.feesCollected();

                let transactionValue = ethers.utils.parseEther('3');
                let signerBalance = await contractInstanceERC20.balanceOf(signer.address);

                const tx = await contractInstanceERC20.approve(contractInstanceExchange.address, signerBalance);
                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                const tx1 = await contractInstanceExchange.deposit({value: transactionValue});
                tx1_result = await provider.waitForTransaction(tx1.hash, confirmations_number);
                if(tx1_result.confirmations < 0 || tx1_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Balances After
                const contractBalanceAfter = await provider.getBalance(contractInstanceExchange.address);
                const feesCollectedAfter = await contractInstanceExchange.feesCollected();
                const vaultBalanceAfter = await contractInstanceERC20.balanceOf(account2.address);
                const invariantAfter = (parseFloat(vaultBalanceAfter)) * ((parseFloat(contractBalanceAfter)) - (parseFloat(feesCollectedAfter)));
                const var_invariant_after = parseFloat(await contractInstanceExchange.invariant());

                const expected_invariant = (parseFloat(vaultBalanceAfter)) * ((parseFloat(contractBalanceBefore)) - (parseFloat(feesCollectedBefore)) + (parseFloat(transactionValue)));
                expect(invariantAfter).to.be.equals(expected_invariant);
                expect(parseFloat(invariantAfter)).to.be.equals(var_invariant_after);
                expect(parseFloat(contractBalanceAfter)).to.be.equals(parseFloat(contractBalanceBefore) + parseFloat(transactionValue));
            });
        });

        describe("setTokenVault", () => {
            it("Should revert if not the owner", async () => {
                await expect(contractInstanceExchange.connect(account1).setTokenVault(account1.address)).to.be.revertedWith("Not authorized");
            });

            it("Should revert if `_tokenVault` the zero account or is a contract", async () => {
                await expect(contractInstanceExchange.setTokenVault(zeroAddress)).to.be.revertedWith("Invalid address _tokenVault");
            });

            it("should revert if `_tokenVault` has not token balance", async () => {
                await expect(contractInstanceExchange.setTokenVault(contractInstanceERC20.address)).to.be.revertedWith("_tokenVault cannot be a contract");
            });

            it("should revert if token vault has no balance", async () => {
                await expect(contractInstanceExchange.setTokenVault(account3.address)).to.be.revertedWith("_tokenVault has no balance");
            });

            it("should revert if token vault has no allowance", async () => {
                const amountToTransfer = ethers.utils.parseEther("150");

                const tx = await contractInstanceERC20.transfer(account3.address, amountToTransfer);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }
                await expect(contractInstanceExchange.setTokenVault(account3.address)).to.be.revertedWith("Invalid tokenVault address");
            });

            it("should set the correct token vault address", async () => {
                const amountToApprove = ethers.utils.parseEther("150");
                const tx = await contractInstanceERC20.connect(account3).approve(contractInstanceExchange.address, amountToApprove);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }
                
                const vaultBalance = parseFloat(await contractInstanceERC20.balanceOf(account3.address));
                
                const tx1 = await contractInstanceExchange.setTokenVault(account3.address);

                tx1_result = await provider.waitForTransaction(tx1.hash, confirmations_number);
                if(tx1_result.confirmations < 0 || tx1_result === undefined) {
                    throw new Error("Transaction failed");
                }
                
                const var_invariant_after = parseFloat(await contractInstanceExchange.invariant());
                const var_vault = await contractInstanceExchange.tokenVault();
                const contractBalance = parseFloat(await provider.getBalance(contractInstanceExchange.address));
                const feesCollected = parseFloat(await contractInstanceExchange.feesCollected());
                const expected_invariant = vaultBalance * (contractBalance - feesCollected);

                expect(var_vault).to.be.equals(account3.address);
                expect(var_invariant_after).to.be.equals(expected_invariant);
            });
        });

        describe("withdrawFeesAmount", () => {
            it("Should revert if not the owner", async () => {
                await expect(contractInstanceExchange.connect(account1).withdrawFeesAmount()).to.be.revertedWith("Not authorized");
            });

            it("Should revert if fee is less than 0.5 ethers", async () => {
                await expect(contractInstanceExchange.withdrawFeesAmount()).to.be.revertedWith("Insufficient amount of fees");
            });

            it("should return the correct amount of ether", async () => {
                const amountToBuy = ethers.utils.parseEther("10");
                const ethAmount = ethers.utils.parseEther("5");

                const tx = await contractInstanceExchange.buyToken(amountToBuy, {value: ethAmount});

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }
                
                const signerBalanceBefore = parseFloat(await provider.getBalance(signer.address));
                const feesBefore = parseFloat(await contractInstanceExchange.feesCollected());
                
                const tx1 = await contractInstanceExchange.withdrawFeesAmount();

                tx1_result = await provider.waitForTransaction(tx1.hash, confirmations_number);
                if(tx1_result.confirmations < 0 || tx1_result === undefined) {
                    throw new Error("Transaction failed");
                }
                
                const signerBalanceAfter = parseFloat(await provider.getBalance(signer.address));
                const feesAfter = parseFloat(await contractInstanceExchange.feesCollected());

                expect(feesAfter).to.be.equals(0);
                expect(signerBalanceAfter).to.be.approximately(signerBalanceBefore + feesBefore, parseFloat(ethers.utils.parseEther('0.001')));
            });
        });
    });
});