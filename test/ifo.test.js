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
        }, [this.mockBEP.address, this.lotteryNFT.address, ether('0.1'), 100, owner, owner]);

        this.proxyInstance = await LotteryUpgradeProxy.new(this.lottery.address, proxyAdmin, abiEncodeData);
        this.lotteryProxyAddress = this.proxyInstance.address;
        this.lottery = await Lottery.at(this.proxyInstance.address);
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
                await this.point_centerIFO.getPoints(this.custom_tokenBEP.address);
            });
        });
    });
});
