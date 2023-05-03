//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/// NFT contract
interface IERC20 {
    function transfer(address _to, uint256 _value) external;
    function transferFrom(address _from, address _to, uint256 _value) external;
    function approve(address _spender, uint256 _value) external;
    function name() external view returns (string memory _name);
    function symbol() external view returns (string memory _symbol);
    function totalSupply() external view returns (uint256);
    function maxSupply() external view returns (uint256);
    function balanceOf(address _owner) external view returns (uint256);
    function allowance(address _owner, address _operator) external view returns (uint256);
}