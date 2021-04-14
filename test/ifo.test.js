const { expectRevert, time, ether, expectEvent } = require('@openzeppelin/test-helpers');
const Lottery = artifacts.require('Lottery');
const MockBEP20 = artifacts.require('MockBEP20');
const LotteryNFT = artifacts.require('LotteryNFT');
const LotteryUpgradeProxy = artifacts.require("LotteryUpgradeProxy");
const OniProfile = artifacts.require('OniProfile');
const PointCenterIFO = artifacts.require('PointCenterIFO');
const IFO = artifacts.require('IFO');


contract('PointCenterIFO',([owner, proxyAdmin, alice, bob, carol]) => {
    beforeEach(async () => {
        this.mockBEP = await MockBEP20.new('Oniswap', 'ONI', ether('1000000000'), { from: owner });
        this.lotteryNFT = await LotteryNFT.new();
        this.lottery = await Lottery.new();

        const abiEncodeData = this.lottery.contract.methods.initialize(
          this.mockBEP.address,
          this.lotteryNFT.address,
          ether('0.1'),
          100,
          owner,
          owner
        ).encodeABI();

        this.proxyInstance = await LotteryUpgradeProxy.new(this.lottery.address, proxyAdmin, abiEncodeData);
        this.lotteryProxyAddress = this.proxyInstance.address;
        this.lottery = await Lottery.at(this.proxyInstance.address);

        await this.lotteryNFT.transferOwnership(this.lottery.address);
        await this.mockBEP.approve(alice, ether('50'));
        await this.mockBEP.transfer(alice, ether('50'));
        await this.mockBEP.approve(this.lottery.address, ether('50'), { from: alice });
        await this.lottery.buy(ether('50'), [1,3,4,3], {from: alice, gas: 4700000});

        const externalRandomNumber = '123';
        await this.lottery.enterDrawingPhase();
        await this.lottery.drawing(externalRandomNumber);


        this.oni_profile = await OniProfile.new(this.mockBEP.address, ether('0.1'), ether('0.1'), ether('0.1'), { from: owner })
        this.point_centerIFO = await PointCenterIFO.new(this.oni_profile.address, '10')

        this.custom_tokenBEP = await MockBEP20.new('Ohmytoken', 'OMT', ether('1000000000'), { from: owner });
        this.ifo = await IFO.new(this.mockBEP.address, this.custom_tokenBEP.address, '1', '1000000000', '1000000000000000000', "100000000", owner)
    });

    describe('#updateMaxViewLength', () => {
        describe('success', () => {
            it('updates the maxViewLength', async () => {
                await this.point_centerIFO.updateMaxViewLength('100', {from: owner});
            });
        });
    });

    describe('#addIFOAddress', () => {
        describe('success', () => {
            it('adds IFO', async () => {
                await this.point_centerIFO.addIFOAddress(this.ifo.address, '1', '1', '10', {from: owner});
            });
        });
    });

    describe('#checkClaimStatus', () => {
        describe('success', () => {
            it('checks claim status', async () => {
                const response = await this.point_centerIFO.checkClaimStatus.call(owner, this.ifo.address);
                console.log(response)
            });
        });
    });

    describe('#getPoints', () => {
        describe('success', () => {
            it('returns points', async () => {
                await this.point_centerIFO.addIFOAddress(this.ifo.address, '1', '1', '10', {from: owner});
                await this.oni_profile.addNftAddress(this.lotteryNFT.address);
                await this.oni_profile.addTeam("Team 1", "Testing");
                await this.oni_profile.createProfile('1', this.lotteryNFT.address, '0');
                await this.point_centerIFO.getPoints(this.ifo.address);
                // await this.point_centerIFO.getPoints(this.custom_tokenBEP.address);
            });
        });
    });
});
