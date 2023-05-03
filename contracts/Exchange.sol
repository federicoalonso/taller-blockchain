//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./interfaces/IERC20.sol";

 /// @notice This contact follows the standard for ERC-20 fungible tokens
 /// @dev Comment follow the Ethereum ´Natural Specification´ language format (´natspec´)
 /// Referencia: https://docs.soliditylang.org/en/v0.8.16/natspec-format.html  
contract Exchange {

    /// STATE VARIABLES
    uint8 public decimals;
    uint256 public feePercentage;
    address public owner;
    address public tokenVault;
    address public erc20Contract;
    uint256 public invariant;
    uint256 public feesCollected;

    /// MODIFIERS
    /**
    * @notice Check if the method is called by the owner.
    * @dev Throw if the sender is not the owner.
    */
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    /**
     * @notice Initialize the state of the contract
     * @dev Throw if `_tokenVault` is the zero address or is a contract.
     * @dev Throw if `_erc20Contract` is the zero address or is not a contract.
     * @dev Throw if `_tokenVault` has fewer tokens than `_tokenAmount`
     * @param _tokenVault sets the address where the tokens will be deposited at the moment 
     * to initialize the liquidity pool. Tokens must be withdrawn from the account of the 
     * protocol owner.
     * @param _erc20Contract sets the address of the ERC20 contract that drives the logic
     * of the tokens to be exchanged.
     * @param _tokenAmount is the amount of tokens with which the Exchange is initialized.
     */
    constructor(address _tokenVault, address _erc20Contract , uint256 _tokenAmount) payable {
        require(_tokenVault != address(0), "Invalid address _tokenVault");
        require(!isContract(_tokenVault), "_tokenVault cannot be a contract");
        require(_erc20Contract != address(0), "_erc20Contract cannot be zero address");
        require(isContract(_erc20Contract), "_erc20Contract is not a contract");
        require(_tokenAmount > 0, 'Invalid _tokenAmount value');
        require(msg.value > 0, 'Invalid ether value');

        uint256 tokenVaultBalance = IERC20(_erc20Contract).balanceOf(_tokenVault);

        require(tokenVaultBalance >= _tokenAmount, "Insufficient tokens in the vault");

        IERC20(_erc20Contract).transferFrom(msg.sender, _tokenVault, _tokenAmount);
        decimals = 18;
        feePercentage = 3 ether / 100;
        feesCollected = 0;
        tokenVault = _tokenVault;
        erc20Contract = _erc20Contract;
        invariant = msg.value * (_tokenAmount + tokenVaultBalance);
        owner = msg.sender;
    }

    /** 
     * @notice Returns the amount of ethers needed to buy the amount of tokens
     * indicated in the _tokenAmount parameter.
     * @dev Throw if `_tokenAmount` is fewer than zero.
     * @param _tokenAmount The number of tokens I want to know its value.
     * @return _amount It is a uint256 number.
     */
    function calculateEtherAmount(uint256 _tokenAmount) public view returns (uint256 _amount) {
        require(_tokenAmount > 0, "Invalid _tokenAmount value");
        uint256 tokVaultBalance = IERC20(erc20Contract).balanceOf(tokenVault);
        uint256 ethBalance = address(this).balance - feesCollected;
        uint256 newTokenBalance = tokVaultBalance - _tokenAmount; 
        uint256 preResult = invariant / newTokenBalance;
        _amount = preResult - ethBalance;
        return _amount;
    }

    /** 
     * @notice Returns the number of tokens that are obtained for one ether 
     * at the time of the query.
     * @return amount It is a uint256 number.
     */
    function getExchangeRate() public view returns (uint256 amount) {
        uint256 token_before = IERC20(erc20Contract).balanceOf(tokenVault);
        uint256 eth_before = address(this).balance - feesCollected;
        amount = token_before - (invariant / (eth_before + 1 ether));
        return amount;
    }

    /**
     * @notice Method that allows to acquire tokens in exchange for Ethers.
     * @dev Throw if `_amountToBuy` is inssufficient or is fewer than zero.
     * @dev Must return the remaining Ethers to the sender.
     * @param _amountToBuy The number of tokens I want to buy.
     */
    function buyToken(uint256 _amountToBuy) public payable {
        require(_amountToBuy > 0, "Invalid _amountToBuy value");
        uint256 tokVaultBalance = IERC20(erc20Contract).balanceOf(tokenVault); 
        uint256 ethBalance = address(this).balance - feesCollected - msg.value; 
        uint256 newTokenBalance = tokVaultBalance - _amountToBuy;
        uint256 preResult = invariant / newTokenBalance;
        uint256 result = preResult - ethBalance;
        uint256 charge = result;
        uint256 fee = charge * feePercentage / 1 ether;
        uint256 total = charge + fee;
        require(msg.value >= total, "Insufficient ethers");

        feesCollected += fee;
        uint256 change = msg.value - total;
        payable(msg.sender).transfer(change);
        IERC20(erc20Contract).transferFrom(tokenVault, msg.sender, _amountToBuy);
    }

    /* 
     * @notice Must change the number of tokens indicated by parameters by the 
     * corresponding number of ethers.
     * @dev Throw if `_amountToExchagne` is fewer than zero or if the account
     * does not have sufficient amount of tokens.
     * @param _amountToExchagne The number of tokens I want to sell.
     */
    function buyEther(uint256 _amountToExchange) public {
        require(IERC20(erc20Contract).balanceOf(msg.sender) >= _amountToExchange, "Insufficient balance");
        require(_amountToExchange > 0, "Invalid _amountToExchange value");

        uint256 eth_before = address(this).balance - feesCollected;
        uint256 token_before = IERC20(erc20Contract).balanceOf(tokenVault);
        uint256 token_now = token_before + _amountToExchange;
        uint256 eth_now = invariant / token_now;
        uint256 charge = eth_before - eth_now;

        uint256 fees = charge * feePercentage / 1 ether;

        uint256 pay = charge - fees;
        feesCollected += fees;

        IERC20(erc20Contract).transferFrom(msg.sender, tokenVault, _amountToExchange);
        payable(msg.sender).transfer(pay);
    }

    /** 
     * @notice Establishes the percentage that is charged for each operation.
     * @dev Only the owner can execute this method.
     * @dev Throw if `_percentage` is fewer than zero.
     * @param _percentage The percentage to be set.
     */
    function setFeePercentage(uint256 _percentage) public onlyOwner() {
        require(_percentage > 0, "Invalid _feePercentage value");
        feePercentage = _percentage;
    }

    /** 
     * @notice Allows only the owner of the protocol to increase the liquidity 
     * of the pool by depositing ethers and tokens at the same time.
     * @dev Only the owner can execute this method.
     * @dev Throw if the value of Ethers received is zero.
     * @dev Throw if the owner account has insufficient amount of tokens.
     */
    function deposit() public payable onlyOwner() {
        require(msg.value > 0, "No ethers deposited");
        uint256 tokenAmount = IERC20(erc20Contract).balanceOf(tokenVault);
        uint256 ethAmount = address(this).balance;
        uint256 amount = tokenAmount - (invariant / (ethAmount + msg.value));
        require(IERC20(erc20Contract).balanceOf(owner) >= amount, "Insufficient balance");

        IERC20(erc20Contract).transferFrom(msg.sender, tokenVault, amount);
        invariant = (address(this).balance - feesCollected) * IERC20(erc20Contract).balanceOf(tokenVault);
    }

    /** 
     * @notice Establishes the address of the account from which the tokens will be 
     * obtained to make the exchanges.
     * @dev Only the owner can execute this method.
     * @dev Throw if `_tokenVault` the zero account or is a contract.
     * @dev Throw if `_tokenVault` has not token balance.
     * @dev Throw if the contract has not allowance to spend tokenVault tokens.
    */
    function setTokenVault(address _tokenVault) public onlyOwner() {
        require(_tokenVault != address(0), "Invalid address _tokenVault");
        require(!isContract(_tokenVault), "_tokenVault cannot be a contract");
        uint256 vaultBalance = IERC20(erc20Contract).balanceOf(_tokenVault);
        require(vaultBalance > 0, "_tokenVault has no balance");
        require(IERC20(erc20Contract).allowance(_tokenVault, address(this)) > 0, "Invalid tokenVault address");

        tokenVault = _tokenVault;
        invariant = (address(this).balance - feesCollected) * vaultBalance;
    }

    /**
     * @notice It must allow only the owner of the protocol to withdraw the
     * profits obtained by the fees.
     * @dev Only the owner can execute this method.
     * @dev Throw if the the fees collected are less than 0.5 Ethers.
    */
    function withdrawFeesAmount() public onlyOwner() {
        require(feesCollected >= 0.5 ether, "Insufficient amount of fees");
        payable(msg.sender).transfer(feesCollected);
        feesCollected = 0;
    }

    /// PRIVATE FUNCTIONS
    /// @notice If an address is a contract returns true, otherwise, false
    /// @param _address The address that we want to know if it's a contract
    function isContract(address _address) private view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_address)
        }
        return size > 0;
    }
}