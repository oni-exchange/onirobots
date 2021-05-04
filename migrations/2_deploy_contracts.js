/* Configure */
const Web3 = require("web3");
const { expectRevert, time, ether, expectEvent } = require('@openzeppelin/test-helpers');
const HDWalletProvider = require('@truffle/hdwallet-provider');

const DotEnv = require('dotenv').config();
const fs = require('fs');
const truffle_config = require('../truffle-config.js');
//console.log(truffle_config);

const mnemonic = fs.readFileSync('../.secret').toString().trim();


/* Load Artifacts */
const Lottery = artifacts.require('Lottery');
const MockBEP20 = artifacts.require('MockBEP20');
const LotteryNFT = artifacts.require('LotteryNFT');
const LotteryUpgradeProxy = artifacts.require('LotteryUpgradeProxy');

const OniToken = artifacts.require("OniToken");
const SyrupBar = artifacts.require('SyrupBar');
const SmartChef = artifacts.require('SmartChef');

const IFO = artifacts.require("IFO");
const OniProfile = artifacts.require('OniProfile');
const PointCenterIFO = artifacts.require('PointCenterIFO');
const ClaimRefund = artifacts.require('ClaimBackOni');

const OniRobots = artifacts.require('OniRobots');
const RobotMintingStation = artifacts.require('RobotMintingStation');
const RobotFactoryV2 = artifacts.require('RobotFactoryV2');
const RobotFactoryV3 = artifacts.require('RobotFactoryV3');

const TradingComp = artifacts.require('TradingCompV1');
const RobotSpecial = artifacts.require('RobotSpecialV1');

const MasterChef = artifacts.require('MasterChef');

//const Treasury = artifacts.require('treasury');
//const treasury = new Treasury({
//    client: null,
//    namespace: 'Treasury',
//    ttl: tauist.s.fiveMinutes
//});


const config = {
    MasterChef: {
        oniPerBlock: '1000',
        startBlock: '100',
        dev: process.env.DEPLOYER_ACCOUNT
    },
    IFO: {
        offeringAmount: '100',
        raisingAmount: '50',
        startBlock: '100',
        endBlock: '200'
    },
    SmartChef: {
        rewardPerBlock: '10',
        startBlock: '100',
        bonusEndBlock: '200'
    },
    OniProfile: {
        numberOniToReactivate: '1',
        numberOniToRegister: '1',
        numberOniToUpdate: '1'
    },
    PointCenterIFO: {
        maxViewLength: '10'
    },
    ClaimRefund: {
        numberOni: '100',
        thresholdUser: '50'
    },
    Robots: {
        baseUri: ""
    },
    RobotFactory: { // V2 & V3
        tokenPrice: '10',
        ipfsHash: 'QmWaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // just an example
        startBlockNumber: '100',
        endBlockNumber: '200'
    },
    RobotSpecial: {
        maxViewLength: '10'
    }
};

const DeployedContracts = {
    test: {},
    testnet: {
        'OniFactory': '0x60e47A82bc6345a5242bA79dbf9482D2d6c0F71a',
        'OniLpERC20': '0x4854bfC47Cb8D8e456e9c02c0948246F59A3C6Cf',
        'UniswapV2Router02': '0x747045abFd14CCE2aA2dA4c02A2dCAe74B134f60',
        'swapV2Pair': '0x9aaf751a340da4d9b8fc45271f6183d12a5f3caf8994bd10dbae6028484de0a3',
        'OniToken': '0x3b2342F494BB99b490EDa9E138F3194eFECf3FfD',
        'SyrupBar': '0x012931BffcdDaf5CB1Cbb0ff1317F3399C68bbD1',
        'SousChef': '0x622a72f2319073e995C0338A12Bf3b0c39218565',
        'MasterChef': '0x5f9A1C552550229C5671F85A1DA9e7Dc4Cc228D6',
        'LotteryRewardPool': '0xB3391B32b5e12253a5Be714bfb06fbeAfc2Dda4A',
        'Lottery': '0x6b615ad825e156De5009485d51088E48303a1D9F',
        'LotteryNFT': '0x490191E0c484c8787Ab79239d70b22f72deb2087',
        'LotteryUpgradeProxy': '0x52CF5C89D2A46FED96C4a341E1Ac956c100a5C6E',
        'BNBStaking': '0x4a6239A2922e8012252468D0CaCaceC6255808fa',
        'Multicall': '0x2D1a3Cbe60bAe408eC5cCCE0aEde0fD6B95fd7ec'
    },
    mainnet: {
    }
};


module.exports = async function(deployer, network, accounts) {
  if (network === 'development' || network === 'test' || network === 'soliditycoverage' || network=='otherhost') {
    const ether = (n) => web3.utils.toWei(n, 'ether');

    await deployer.deploy(LotteryNFT);
    await deployer.deploy(MockBEP20, "Mock BEP20", "MB20", ether('100'));
    await deployer.deploy(Lottery);

    const proxyAdmin = accounts[0];
    const lotteryOwner = accounts[1];
    const lotteryAdmin = accounts[1];

    const abiEncodeData = web3.eth.abi.encodeFunctionCall({
        "inputs": [
            {
                "internalType": "contract IERC20",
                "name": "_oni",
                "type": "address"
            },
            {
                "internalType": "contract LotteryNFT",
                "name": "_lottery",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_minPrice",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "_maxNumber",
                "type": "uint8"
            },
            {
                "internalType": "address",
                "name": "_owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_adminAddress",
                "type": "address"
            }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }, [
        MockBEP20.address,
        LotteryNFT.address,
        '1',
        '5',
        lotteryOwner,
        lotteryAdmin
    ]);

    const lotteryUpgradeProxy = await deployer.deploy(LotteryUpgradeProxy, Lottery.address, proxyAdmin, abiEncodeData);
    const lotteryNft = await LotteryNFT.deployed();
    await lotteryNft.transferOwnership(lotteryUpgradeProxy.address);
  } else if (network === 'bsctestnet') { // binance testnet
    await deployer.deploy(OniToken, { from: process.env.DEPLOYER_ACCOUNT });
    const OniTokenInstance = await OniToken.deployed();
    await deployer.deploy(SyrupBar, OniTokenInstance.address, { from: process.env.DEPLOYER_ACCOUNT });
    const SyrupBarInstance = await SyrupBar.deployed();
    await deployer.deploy(MasterChef,
        OniTokenInstance.address,
        SyrupBarInstance.address,
        process.env.DEPLOYER_ACCOUNT,
        config.MasterChef.oniPerBlock,
        config.MasterChef.startBlock,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const MasterChefInstance = await MasterChef.deployed();

    // chef owns oni & syrup tokens
    await OniTokenInstance.transferOwnership(MasterChefInstance.address, { from: process.env.DEPLOYER_ACCOUNT });
    await SyrupBarInstance.transferOwnership(MasterChefInstance.address, { from: process.env.DEPLOYER_ACCOUNT });

    await deployer.deploy(IFO,
        OniTokenInstance.address,
        SyrupBarInstance.address,
        config.IFO.startBlock,
        config.IFO.endBlock,
        config.IFO.offeringAmount,
        config.IFO.raisingAmount,
        process.env.DEPLOYER_ACCOUNT,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const IFOInstance = await IFO.deployed();

    await deployer.deploy(SmartChef,
        SyrupBarInstance.address,
        OniTokenInstance.address,
        config.SmartChef.rewardPerBlock,
        config.SmartChef.startBlock,
        config.SmartChef.bonusEndBlock,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const SmartChefInstance = await SmartChef.deployed();

    await deployer.deploy(OniProfile,
        OniTokenInstance.address,
        config.OniProfile.numberOniToReactivate,
        config.OniProfile.numberOniToRegister,
        config.OniProfile.numberOniToUpdate,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const OniProfileInstance = await OniProfile.deployed();

    await deployer.deploy(PointCenterIFO,
        OniTokenInstance.address,
        config.PointCenterIFO.maxViewLength,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const PointCenterIFOInstance = await PointCenterIFO.deployed();

    await deployer.deploy(ClaimRefund,
        OniTokenInstance.address,
        OniProfileInstance.address,
        config.ClaimRefund.numberOni,
        config.ClaimRefund.thresholdUser,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const ClaimRefundInstance = await ClaimRefund.deployed();

    await deployer.deploy(OniRobots,
        config.Robots.baseUri,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const OniRobotsInstance = await OniRobots.deployed();

    await deployer.deploy(RobotMintingStation,
        OniRobotsInstance .address,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const RobotMintingStationInstance = await RobotMintingStation.deployed();

    // RobotFactoryV2
    await deployer.deploy(RobotFactoryV2,
        OniRobotsInstance .address,
        OniTokenInstance.address,
        config.RobotFactory.tokenPrice,
        config.RobotFactory.ipfsHash,
        config.RobotFactory.startBlockNumber,
        config.RobotFactory.endBlockNumber,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const RobotFactoryV2Instance = await RobotFactoryV2.deployed();

    // RobotFactoryV3
    await deployer.deploy(RobotFactoryV3,
        RobotFactoryV2Instance .address,
        RobotMintingStationInstance .address,
        OniTokenInstance.address,
        config.RobotFactory.tokenPrice,
        config.RobotFactory.ipfsHash,
        config.RobotFactory.startBlockNumber,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const RobotFactoryV3Instance = await RobotFactoryV3.deployed();

    await deployer.deploy(TradingComp,
        OniProfileInstance .address,
        RobotMintingStationInstance .address,
        OniTokenInstance.address,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const TradingCompInstance = await TradingComp.deployed();

    await deployer.deploy(RobotSpecial,
        RobotMintingStationInstance .address,
        OniTokenInstance.address,
        OniProfileInstance .address,
        config.RobotSpecial.maxViewLength,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const RobotSpecialInstance = await RobotSpecial.deployed();

    // тут FastswapFactory - название контракта, который собираешься деплоить, process.env.RINKEBY_FACTORY_OWNER - параметр конструктора, который я задаю через .env, { from: process.env.DEPLOYER_ACCOUNT } - аккаунт, 12 слов от которого указаны в .secret
  } else if (network === 'bsc') { // binance mainnet
//    const Web3 = require('web3');
//    const web3 = new Web3(new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545'));
//    const b = await deployer.deploy(FastswapFactory, process.env.MAINNET_FACTORY_OWNER, { from: process.env.DEPLOYER_ACCOUNT });
  }
//  } else {
//    const Web3 = require('web3');
//    const web3 = new Web3(new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545'));
//
//    await deployer.deploy(LotteryNFT);
//    const oni = await MockBEP20.at('0x43acC9A5E94905c7D31415EB410F3E666e5F1e9A');
//    await deployer.deploy(Lottery);
//
//    proxyAdmin= '0x0F9399FC81DaC77908A2Dde54Bb87Ee2D17a3373';
//    lotteryOwner= '0xB9FA21a62FC96Cb2aC635a051061E2E50d964051'
//    lotteryAdmin= '0xB9FA21a62FC96Cb2aC635a051061E2E50d964051';
//
//    const abiEncodeData = web3.eth.abi.encodeFunctionCall({
//      "inputs": [
//        {
//          "internalType": "contract IERC20",
//          "name": "_oni",
//          "type": "address"
//        },
//        {
//          "internalType": "contract LotteryNFT",
//          "name": "_lottery",
//          "type": "address"
//        },
//        {
//          "internalType": "uint8",
//          "name": "_maxNumber",
//          "type": "uint8"
//        },
//        {
//          "internalType": "address",
//          "name": "_owner",
//          "type": "address"
//        },
//        {
//          "internalType": "address",
//          "name": "_adminAddress",
//          "type": "address"
//        }
//      ],
//      "name": "initialize",
//      "outputs": [],
//      "stateMutability": "nonpayable",
//      "type": "function"
//    }, [oni.address, LotteryNFT.address, '5', lotteryOwner, lotteryAdmin]);
//
//    await deployer.deploy(LotteryUpgradeProxy, Lottery.address, proxyAdmin, abiEncodeData);
//
//    const lotteryNft = await LotteryNFT.deployed();
//    await lotteryNft.transferOwnership(LotteryUpgradeProxy.address);
//  }
};
