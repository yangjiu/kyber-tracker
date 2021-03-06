const _ = require('lodash');

const abiDecoder = require('abi-decoder');
const BigNumber = require('bignumber.js');
const getWeb3Instance = require('./getWeb3Instance');
const kyberABI = require('../../config/abi/kyber');
const burnedFeeABI = require('../../config/abi/burned_fee');
abiDecoder.addABI(kyberABI);
abiDecoder.addABI(burnedFeeABI);

const network = require('../../config/network');
const tokens = network.tokens;
const contractAddresses = network.contractAddresses;
const tokensByAddress = _.keyBy(_.values(tokens), o => o.address.toLowerCase());

module.exports = {

  getKyberABIDecoder: function() {
    return abiDecoder;
  },

  getWeb3Instance: function() {
    return getWeb3Instance();
  },

  getTokenFromAddress: function(address) {
    return tokensByAddress[address.toLowerCase()] || null;
  },

  getStringExp10: function(decimal) {
    return '1' + '0'.repeat(decimal);
  },

  getExchangeTopicHash: function() {
    return network.logTopics.exchange;
  },

  getFeeToWalletTopicHash: function() {
    return network.logTopics.feeToWallet;
  },

  getBurnFeesTopicHash: function() {
    return network.logTopics.burnFee;
  },

  getERC20TransferTopicHash: function () {
    return network.logTopics.erc20Transfer;
  },

  getKyberNetworkContractAddress: function() {
    return network.contractAddresses.network;
  },

  getKNCTokenAddress: function() {
    return network.tokens.KNC.address;
  },

  isBurnerContractAddress: function (addr) {
    if (!addr) {
      return false;
    }

    addr = addr.toLowerCase();

    return addr === contractAddresses.feeBurner1 || addr === contractAddresses.feeBurner2;
  },
  sumBig(arrayParams, initState) {
    return arrayParams.reduce((a, b) => {
      let bigA = a ? new BigNumber(a.toString()) : new BigNumber(0)
      let bigB = b ? new BigNumber(b.toString()) : new BigNumber(0)
      return bigA.plus(bigB)
    }, new BigNumber(initState))
    .toString()
  }

};
