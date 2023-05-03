const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config();

const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/html/index.html'));
})

app.get('/index.css',function(req,res){
  res.sendFile(path.join(__dirname + '/css/index.css')); 
});

app.get('/index.js',function(req,res){
  res.sendFile(path.join(__dirname + '/js/index.js')); 
});

app.get('/erc20.js',function(req,res){
  res.sendFile(path.join(__dirname + '/js/erc20.js')); 
});

app.get('/exchange.js',function(req,res){
  res.sendFile(path.join(__dirname + '/js/exchange.js')); 
});

app.get('/crypto-tokens.jpg',function(req,res){
  res.sendFile(path.join(__dirname + '/assets/crypto-tokens.jpg')); 
});

app.get('/Ethereum-ETH-icon.png',function(req,res){
  res.sendFile(path.join(__dirname + '/assets/Ethereum-ETH-icon.png')); 
});

app.listen(port, () => {
  console.log(`TT2 Exchanger app listening on port ${port}`)
})
