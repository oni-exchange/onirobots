/* Configure */
const Web3 = require("web3");
const { expectRevert, time, ether, expectEvent } = require('@openzeppelin/test-helpers');
const HDWalletProvider = require('@truffle/hdwallet-provider');

const DotEnv = require('dotenv').config();
const fs = require('fs');
const truffle_config = require('../truffle-config.js');

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

const config = {
//    MasterChef: {
//        oniPerBlock: '1000',
//        startBlock: '100',
//        dev: process.env.DEPLOYER_ACCOUNT
//    },
    IFO: {
//        adminAddress: process.env.IFO_ADMIN_ADDRESS,
        offeringAmount: '100',
        raisingAmount: '80',
        startBlock: '8571079', // + ~1 day
        endBlock: '8892171' // + ~11 days
    },
//    SmartChef: {
//        rewardPerBlock: '10',
//        startBlock: '100',
//        bonusEndBlock: '200'
//    },
    OniProfile: {
//        NFT_ROLE_ADDRESS: process.env.NFT_ROLE_ADDRESS,
//        POINT_ROLE_ADDRESS: process.env.POINT_ROLE_ADDRESS,
//        SPECIAL_ROLE_ADDRESS: process.env.SPECIAL_ROLE_ADDRESS,
        numberOniToReactivate: '1',
        numberOniToRegister: '1',
        numberOniToUpdate: '1'
    },
    PointCenterIFO: {
        maxViewLength: '10'
    },
    ClaimBackOni: {
        numberOni: '10',
        thresholdUser: '5'
    },
    Robots: {
        baseUri: "127.0.0.1"
    },
    RobotFactory: { // V2 & V3
        tokenPrice: '1',
        ipfsHash: 'QmWaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        startBlockNumber: '8571079', // + ~1 day
        endBlockNumber: '8892171' // + ~11 days
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
        process.env.IFO_ADMIN_ADDRESS,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const IFOInstance = await IFO.deployed();
//    console.log(IFOInstance);

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
//    console.log(OniProfileInstance)

    await deployer.deploy(PointCenterIFO,
        oniTokenAddress,
        config.PointCenterIFO.maxViewLength,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const PointCenterIFOInstance = await PointCenterIFO.deployed();
//    console.log(PointCenterIFOInstance)

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
        RobotMintingStationInstance.address,
        oniTokenAddress,
        config.RobotFactory.tokenPrice,
        config.RobotFactory.ipfsHash,
        config.RobotFactory.startBlockNumber,
        { from: process.env.DEPLOYER_ACCOUNT }
        );
    const RobotFactoryV3Instance = await RobotFactoryV3.deployed();

    await deployer.deploy(TradingCompV1,
        OniProfileInstance .address,
        RobotMintingStationInstance.address,
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

    // ----------------  INITIALIZE ----------------

    // get roles
    const nftRole = await OniProfileInstance.NFT_ROLE();
    const pointRole = await OniProfileInstance.POINT_ROLE();
    const specialRole = await OniProfileInstance.SPECIAL_ROLE();

    // grant roles
    console.log(process.env.NFT_ROLE_ADDRESS);
    console.log(process.env.POINT_ROLE_ADDRESS);
    console.log(process.env.SPECIAL_ROLE_ADDRESS);

//    await OniProfileInstance.grantRole(nftRole, process.env.NFT_ROLE_ADDRESS);
    await OniProfileInstance.grantRole(pointRole, process.env.POINT_ROLE_ADDRESS);
    await OniProfileInstance.grantRole(specialRole, process.env.SPECIAL_ROLE_ADDRESS);
    // TODO (IntegralTeam): test following
    await OniProfileInstance.addNftAddress(
        OniRobotsInstance.address,
        { from: process.env.DEPLOYER_ACCOUNT }
        );

    await OniRobotsInstance.transferOwnership(
        RobotMintingStationInstance.address,
        { from: process.env.DEPLOYER_ACCOUNT }
        );

    const minterRole = await RobotMintingStationInstance.MINTER_ROLE();
    await RobotMintingStationInstance.grantRole(
        minterRole,
        process.env.MINTER_ADDRESS,
        { from: process.env.DEPLOYER_ACCOUNT });

    await RobotMintingStationInstance.grantRole(
        minterRole,
        RobotFactoryV3Instance.address,
        { from: process.env.DEPLOYER_ACCOUNT });

    await RobotMintingStationInstance.grantRole(
        minterRole, RobotSpecialInstance.address,
        { from: process.env.DEPLOYER_ACCOUNT });

    // create teams

    await OniProfileInstance.addTeam("YELLOW TESLA", "Intelligent TESLA robot with competitive nature.");
    await OniProfileInstance.addTeam("RED APEX", "Battle APEX robot with advanced AI system.");
    await OniProfileInstance.addTeam("WHITE ONIX", "Friendly ONIX that loves AMM and traveling through wi-fi.");
    await OniProfileInstance.addTeam("GREEN SCRAPER", "Hungry SCRAPER that eats APY for breakfast.");

    // not required for now
//    await RobotSpecialInstance.addRobot(11, "robotrobotrobot.robot", 5, 1);
//    await expectEvent.inTransaction(
//      tx,
//      RobotSpecialInstance,
//      'RobotAdd', {  },
//      { robotId: 1, thresholdUser: 5, costCake: 1 },
//    );

  } else if (network === 'bsc') { // binance mainnet
    // do nothing for now
  }
};
