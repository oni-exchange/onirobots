require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const mnemonic = fs.readFileSync('.secret').toString().trim();

module.exports = {
  networks : {
    development : {host : "127.0.0.1", port : 8545, network_id : "*"},
//    test : {host : "127.0.0.1", port : 8545, network_id : "*"},
//    otherhost : {host : "192.168.1.2", port : 7545, network_id : "*"},
    bsctestnet : {
      provider : () => new HDWalletProvider(
          mnemonic, `https://data-seed-prebsc-1-s1.binance.org:8545`),
      network_id : 97,
      confirmations : 2,
      timeoutBlocks : 200,
      from : process.env.DEPLOYER_ACCOUNT,
      // skipDryRun: true
    },
    bsc : {
      provider : () =>
          new HDWalletProvider(mnemonic, `https://bsc-dataseed1.binance.org`),
      network_id : 56,
      confirmations : 10,
      timeoutBlocks : 200,
      from : process.env.DEPLOYER_ACCOUNT,
      // skipDryRun: true
    },
  },
  plugins : [ 'truffle-plugin-verify' ],
  api_keys : {
    bscscan : process.env.BSCSCAN_API_KEY,
  },
  compilers : {
    solc : {
      version : "0.6.12",
      settings :
          {optimizer : {enabled : true, runs : 999999}, evmVersion : "istanbul"}
    }
  }
};
