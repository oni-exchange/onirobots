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
const MockBEP20 = artifacts.require('MockBEP20');

const IFO = artifacts.require("IFO");
const OniProfile = artifacts.require('OniProfile');
const PointCenterIFO = artifacts.require('PointCenterIFO');
const ClaimBackOni = artifacts.require('ClaimBackOni');

const OniRobots = artifacts.require('OniRobots');
const RobotMintingStation = artifacts.require('RobotMintingStation');
const RobotFactoryV2 = artifacts.require('RobotFactoryV2');
const RobotFactoryV3 = artifacts.require('RobotFactoryV3');

const TradingCompV1= artifacts.require('TradingCompV1');
const RobotSpecialV1 = artifacts.require('RobotSpecialV1');

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
    ClaimBackOni: {
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

module.exports = async function(deployer, network, accounts) {
  if (network === 'development' || network === 'test' || network === 'soliditycoverage' || network=='otherhost') {
    // do nothing for now
  } else if (network === 'bsctestnet') { // binance testnet
    // hard-coded onitoken address deployed previously
    const oniTokenAddress = process.env.ONI_TOKEN_ADDRESS;
    const syrupTokenAddress = process.env.SYRUP_TOKEN_ADDRESS;

//    await deployer.deploy(OniToken, { from: process.env.DEPLOYER_ACCOUNT });
//    const OniTokenInstance = await OniToken.deployed();
//    await deployer.deploy(SyrupBar, OniTokenInstance.address, { from: process.env.DEPLOYER_ACCOUNT });
//    const SyrupBarInstance = await SyrupBar.deployed();
//    await deployer.deploy(MasterChef,
//        OniTokenInstance.address,
//        SyrupBarInstance.address,
//        process.env.DEPLOYER_ACCOUNT,
//        config.MasterChef.oniPerBlock,
//        config.MasterChef.startBlock,
//        { from: process.env.DEPLOYER_ACCOUNT }
//        );
//    const MasterChefInstance = await MasterChef.deployed();

    // chef owns oni & syrup tokens
    // TODO (IntegralTeam): need to consolidate owners
//    await OniTokenInstance.transferOwnership(MasterChefInstance.address, { from: process.env.DEPLOYER_ACCOUNT });
//    await SyrupBarInstance.transferOwnership(MasterChefInstance.address, { from: process.env.DEPLOYER_ACCOUNT });

    await deployer.deploy(IFO,
        oniTokenAddress,
        syrupTokenAddress,
        config.IFO.startBlock,
        config.IFO.endBlock,
        config.IFO.offeringAmount,
        config.IFO.raisingAmount,
        process.env.DEPLOYER_ACCOUNT,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const IFOInstance = await IFO.deployed();

//    await deployer.deploy(SmartChef,
//        SyrupBarInstance.address,
//        OniTokenInstance.address,
//        config.SmartChef.rewardPerBlock,
//        config.SmartChef.startBlock,
//        config.SmartChef.bonusEndBlock,
//        { from: process.env.DEPLOYER_ACCOUNT }
//        );
//    const SmartChefInstance = await SmartChef.deployed();

    await deployer.deploy(OniProfile,
        oniTokenAddress,
        config.OniProfile.numberOniToReactivate,
        config.OniProfile.numberOniToRegister,
        config.OniProfile.numberOniToUpdate,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const OniProfileInstance = await OniProfile.deployed();

    await deployer.deploy(PointCenterIFO,
        oniTokenAddress,
        config.PointCenterIFO.maxViewLength,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const PointCenterIFOInstance = await PointCenterIFO.deployed();

    await deployer.deploy(ClaimBackOni,
        oniTokenAddress,
        OniProfileInstance.address,
        config.ClaimBackOni.numberOni,
        config.ClaimBackOni.thresholdUser,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const ClaimRefundInstance = await ClaimBackOni.deployed();

    await deployer.deploy(OniRobots,
        config.Robots.baseUri,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const OniRobotsInstance = await OniRobots.deployed();

    await deployer.deploy(RobotMintingStation,
        OniRobotsInstance.address,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const RobotMintingStationInstance = await RobotMintingStation.deployed();

    // RobotFactoryV2
    await deployer.deploy(RobotFactoryV2,
        OniRobotsInstance.address,
        oniTokenAddress,
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
        oniTokenAddress,
        config.RobotFactory.tokenPrice,
        config.RobotFactory.ipfsHash,
        config.RobotFactory.startBlockNumber,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const RobotFactoryV3Instance = await RobotFactoryV3.deployed();

    await deployer.deploy(TradingCompV1,
        OniProfileInstance .address,
        RobotMintingStationInstance .address,
        oniTokenAddress,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const TradingCompInstance = await TradingCompV1.deployed();

    await deployer.deploy(RobotSpecialV1,
        RobotMintingStationInstance.address,
        oniTokenAddress,
        OniProfileInstance.address,
        config.RobotSpecial.maxViewLength,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const RobotSpecialInstance = await RobotSpecialV1.deployed();
  } else if (network === 'bsc') { // binance mainnet
    // do nothing for now
  }
};
