const { expectRevert, time, ether, expectEvent } = require('@openzeppelin/test-helpers');
const Lottery = artifacts.require('Lottery');
const MockBEP20 = artifacts.require('MockBEP20');
const LotteryNFT = artifacts.require('LotteryNFT');
const LotteryUpgradeProxy = artifacts.require("LotteryUpgradeProxy");
const OniProfile = artifacts.require("OniProfile");

contract('OniProfile',([owner, proxyAdmin, alice, bob, carol]) => {
    beforeEach(async () => {
        this.mockBEP = await MockBEP20.new("Oniswap", "ONI", ether('1000000000'), { from: owner });
        this.lotteryNFT = await LotteryNFT.new()
        this.lottery = await Lottery.new()
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
        }, [this.mockBEP.address, this.lotteryNFT.address, ether('1'), 100, owner, owner]);

        const proxyInstance = await LotteryUpgradeProxy.new(this.lottery.address, proxyAdmin, abiEncodeData);
        this.lottery = await Lottery.at(proxyInstance.address);

        await this.mockBEP.transfer(bob, ether('2'), { from: owner });
        await this.mockBEP.transfer(alice, ether('2'), { from: owner });
        await this.mockBEP.transfer(carol, ether('2'), { from: owner });

        this.oni_profile = await OniProfile.new(this.mockBEP.address, ether('1'), ether('1'), ether('1'), { from:owner })
    });

    it('test', async () => {
      const minPrice = await this.lottery.minPrice.call();
      console.log('minPrice',  minPrice.toString());
    });

    describe('#addTeam', () => {
        describe('failure', () => {
            it('reverts when name is too short', async () => {
                await expectRevert(this.oni_profile.addTeam("T", "It is the best team ever", { from: owner }), "Must be > 3");
            });

            it('reverts when name is too long', async () => {
                await expectRevert(this.oni_profile.addTeam("TeamTeamTeamTeamTeamTeam", "It is the best team ever", { from: owner }), "Must be < 20");
            });

            it('reverts when requester is not admin', async () => {
                await expectRevert(this.oni_profile.addTeam("Team", "It is the best team ever", { from: alice }), "Not the main admin");
            });
        });

        describe('success', () => {
            it('emits a TeamAdd event', async () => {
                const result = await this.oni_profile.addTeam("Team", "It is the best team ever", {from: owner});
                console.log(result.logs.args)
                await expectEvent.inTransaction(result.tx, this.oni_profile, "TeamAdd");
            });
        });
    });

    describe('#createProfile', ()=>{
        describe('failure', () => {
            it('reverts when name is too short', async () => {
                await expectRevert(this.oni_profile.addTeam("T", "It is the best team ever", {from: owner}), "Must be > 3");
            });
        });
    });
});
