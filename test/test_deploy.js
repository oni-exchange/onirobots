const Web3 = require("web3");

const { expectRevert, time, ether, expectEvent } = require('@openzeppelin/test-helpers');

//require('OniTokenGetArtifacts');

require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const mnemonic = fs.readFileSync('.secret').toString().trim();

//const Lottery = artifacts.require('Lottery');
//const MockBEP20 = artifacts.require('MockBEP20');
//const LotteryNFT = artifacts.require('LotteryNFT');
//const LotteryUpgradeProxy = artifacts.require('LotteryUpgradeProxy');

//const OniToken = artifacts.require("OniToken");
//const SyrupBar = artifacts.require('SyrupBar');
const IFO = artifacts.require("IFO");
const OniProfile = artifacts.require('OniProfile');
const PointCenterIFO = artifacts.require('PointCenterIFO');
const ClaimRefund = artifacts.require('ClaimBackOni');

const OniRobots = artifacts.require('OniRobots');
const RobotMintingStation = artifacts.require('RobotMintingStation');
const RobotFactoryV2 = artifacts.require('RobotFactoryV2');
const RobotFactoryV3 = artifacts.require('RobotFactoryV3');

const TradingCompV1 = artifacts.require('TradingCompV1');
const RobotSpecial = artifacts.require('RobotSpecialV1');

//const MasterChef = artifacts.require('MasterChef');
//const SmartChef = artifacts.require('SmartChef');


const config = {
    MasterChef: {
        oniPerBlock: '1000',
        startBlock: '100'
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


contract('TestDeploy', ([alice, bob, carol, dev, owner]) => {
    beforeEach(async () => {
    const oniTokenAddress = process.env.ONI_TOKEN_ADDRESS;

//        this.oni = await OniToken.new({ from: owner });
//        this.syrup = await SyrupBar.new(this.oni.address, { from: owner });
//
//        // deploy lpTokens
//        this.lp1 = await MockBEP20.new('LPToken', 'LP1', '1000000', { from: owner });
//        this.lp2 = await MockBEP20.new('LPToken', 'LP2', '1000000', { from: owner });
//        this.lp3 = await MockBEP20.new('LPToken', 'LP3', '1000000', { from: owner });
//
//        // masterchef
//        this.masterChef = await MasterChef.new(
//            this.oni.address,
//            this.syrup.address,
//            dev, config.MasterChef.oniPerBlock,
//            config.MasterChef.startBlock,
//            { from: owner }
//        );

        // chef owns oni & syrup tokens
        // TODO(IntegralTeam): separate owners for different contracts, this code will throw, need to combine owners
//        await this.oni.transferOwnership(this.masterChef.address, { from: owner });
//        await this.syrup.transferOwnership(this.masterChef.address, { from: owner });

        // not sure about admin address, is it the same as MasterChef's dev address?
        this.ifo = await IFO.new(
            oniTokenAddress,
            this.syrup.address,
            config.IFO.startBlock,
            config.IFO.endBlock,
            config.IFO.offeringAmount,
            config.IFO.raisingAmount,
            dev, {from: owner}
        );

//        this.smartChef = await SmartChef.new(
//            this.syrup.address,
//            this.oni.address,
//            config.SmartChef.rewardPerBlock,
//            config.SmartChef.startBlock,
//            config.SmartChef.bonusEndBlock,
//            {from: owner}
//        );

        this.oniProfile = await OniProfile.new(
            oniTokenAddress,
            config.OniProfile.numberOniToReactivate,
            config.OniProfile.numberOniToRegister,
            config.OniProfile.numberOniToUpdate,
            {from: owner}
        );

        this.pointCenterIfo = await PointCenterIFO.new(
            this.oniProfile.address,
            config.PointCenterIFO.maxViewLength,
            {from: owner}
        );

        this.claimRefund = await ClaimRefund.new(
            oniTokenAddress,
            this.oniProfile.address,
            config.ClaimRefund.numberOni,
            config.ClaimRefund.thresholdUser,
            {from: owner}
        );

        this.oniRobots = await OniRobots.new(
            config.Robots.baseUri,
            {from: owner}
        );

        this.robotMintingStation = await RobotMintingStation.new(
            this.oniRobots.address, {from: owner}
        );

        // RobotFactoryV2
        this.robotFactoryV2 = await RobotFactoryV2.new(
            this.oniRobots.address,
            oniTokenAddress,
            config.RobotFactory.tokenPrice,
            config.RobotFactory.ipfsHash,
            config.RobotFactory.startBlockNumber,
            config.RobotFactory.endBlockNumber,
            {from: owner}
        );

        // RobotFactoryV3
        this.robotFactoryV3 = await RobotFactoryV3.new(
            this.robotFactoryV2.address,
            this.robotMintingStation.address,
            oniTokenAddress,
            config.RobotFactory.tokenPrice,
            config.RobotFactory.ipfsHash,
            config.RobotFactory.startBlockNumber
        );

        this.tradingCompV1 = await TradingCompV1.new(
            this.oniProfile.address,
            this.robotMintingStation.address,
            oniTokenAddress,
            {from: owner}
        );

        this.robotSpecial = await RobotSpecial.new(
            this.robotMintingStation.address,
            oniTokenAddress,
            this.oniProfile.address,
            config.RobotSpecial.maxViewLength,
            {from: owner}
        );
    });

    it('do something', async () => {
        console.log('do nothing');
//      await this.lp1.transfer(bob, '2000', { from: owner });
//      await this.lp2.transfer(bob, '2000', { from: owner });
//      await this.lp3.transfer(bob, '2000', { from: owner });
//      await this.lp1.transfer(alice, '2000', { from: owner });
//      await this.lp2.transfer(alice, '2000', { from: owner });
//      await this.lp3.transfer(alice, '2000', { from: owner });
//
//      await this.masterChef.add('1000', this.lp1.address, true, { from: owner });
//      await this.masterChef.add('1000', this.lp2.address, true, { from: owner });
//      await this.masterChef.add('1000', this.lp3.address, true, { from: owner });
//      await this.lp1.approve(this.masterChef.address, '10', { from: alice });
//      await this.masterChef.deposit(1, '2', { from: alice }); //0
//      await this.masterChef.withdraw(1, '2', { from: alice }); //1
//
//      await this.oni.approve(this.masterChef.address, '250', { from: alice });
//      await this.masterChef.enterStaking('240', { from: alice }); //3
//      assert.equal((await this.syrup.balanceOf(alice)).toString(), '240');
//      assert.equal((await this.oni.balanceOf(alice)).toString(), '10');
//      await this.masterChef.enterStaking('10', { from: alice }); //4
//      assert.equal((await this.syrup.balanceOf(alice)).toString(), '250');
//      assert.equal((await this.oni.balanceOf(alice)).toString(), '249');
//      await this.masterChef.leaveStaking(250);
//      assert.equal((await this.syrup.balanceOf(alice)).toString(), '0');
//      assert.equal((await this.oni.balanceOf(alice)).toString(), '749');
    });

});
