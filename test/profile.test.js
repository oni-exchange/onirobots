const { expectRevert, time, ether, expectEvent } = require('@openzeppelin/test-helpers');
const Lottery = artifacts.require('Lottery');
const MockBEP20 = artifacts.require('MockBEP20');
const LotteryNFT = artifacts.require('LotteryNFT');
const LotteryUpgradeProxy = artifacts.require("LotteryUpgradeProxy");
const OniProfile = artifacts.require('OniProfile');


contract('OniProfile',([owner, proxyAdmin, alice, bob, carol]) => {
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
    });

    // commented to make tests run faster
    // uncomment to run
    // it('test', async () => {
    //   const minPrice = await this.lottery.minPrice.call();
    //   // console.log('minPrice',  minPrice.toString());
    // });

    // commented to make tests run faster
    // uncomment to run
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
                await expectEvent.inTransaction(result.tx, this.oni_profile, "TeamAdd");
            });
        });
    });


    // commented to make tests run faster
    // uncomment to run
    describe('#addNftAddress', ()=>{
        describe('success', ()=>{
            it('adding nft contract address', async ()=>{
                await this.oni_profile.addNftAddress(this.lotteryNFT.address);
            })
        })
    })

    describe('#createProfile', ()=>{
        describe('failure', () => {
            it('reverts if Invalid teamId', async () => {
                await expectRevert(this.oni_profile.createProfile("1", owner, "1"), "Invalid teamId");
            });
            it('reverts if NFT address invalid', async () => {
                await this.oni_profile.addTeam("Team", "It is the best team ever", {from: owner});
                await expectRevert(this.oni_profile.createProfile("1", owner, "1"), "NFT address invalid");
            });
        });
        describe('success', () => {
            it('creates a new profile', async () => {
                await this.oni_profile.addTeam("Team", "It is the best team ever", {from: owner});
                await this.oni_profile.addNftAddress(this.lotteryNFT.address);
                await this.lotteryNFT.transferOwnership(this.lottery.address);
                await this.mockBEP.approve(this.lottery.address, ether('10'), { from: owner });
                await this.lottery.buy(ether('1'), [1, 2, 3, 4], {from: owner});
                await this.mockBEP.approve(this.oni_profile.address, ether('10'), { from: owner });
                await this.lotteryNFT.approve(this.oni_profile.address, '1', { from: owner });

                await this.oni_profile.createProfile('1', this.lotteryNFT.address, '1', {from: owner});
            });
        });
    });
    describe('#pauseProfile', ()=>{
        describe('success', () => {
            it('pauses a profile', async () => {
                await this.oni_profile.addTeam("Team", "It is the best team ever", {from: owner});
                await this.oni_profile.addNftAddress(this.lotteryNFT.address);
                await this.lotteryNFT.transferOwnership(this.lottery.address);
                await this.mockBEP.approve(this.lottery.address, ether('10'), { from: owner });
                await this.lottery.buy(ether('1'), [1, 2, 3, 4], {from: owner});
                await this.mockBEP.approve(this.oni_profile.address, ether('10'), { from: owner });
                await this.lotteryNFT.approve(this.oni_profile.address, '1', { from: owner });
                await this.oni_profile.createProfile('1', this.lotteryNFT.address, '1', {from: owner});

                await this.oni_profile.pauseProfile({from: owner});
            });
        });
        describe('failure', () => {
            it('reverts if User not active', async () => {
                await this.oni_profile.addTeam("Team", "It is the best team ever", {from: owner});
                await this.oni_profile.addNftAddress(this.lotteryNFT.address);
                await this.lotteryNFT.transferOwnership(this.lottery.address);
                await this.mockBEP.approve(this.lottery.address, ether('10'), { from: owner });
                await this.lottery.buy(ether('1'), [1, 2, 3, 4], {from: owner});
                await this.mockBEP.approve(this.oni_profile.address, ether('10'), { from: owner });
                await this.lotteryNFT.approve(this.oni_profile.address, '1', { from: owner });
                await this.oni_profile.createProfile('1', this.lotteryNFT.address, '1', {from: owner});

                await this.oni_profile.pauseProfile({from: owner});
                await expectRevert(this.oni_profile.pauseProfile({from: owner}), 'User not active');
            });
            it('reverts if Has not registered', async () => {
                  await expectRevert(this.oni_profile.pauseProfile({from: owner}), 'Has not registered');
            });
        });
    });

    // commented to make tests run faster
    // uncomment to run
    // describe('#lottery.buy', ()=>{
    //     describe('success', ()=>{
    //         it('buying drawing', async ()=>{
    //             await this.lotteryNFT.transferOwnership(this.lottery.address)
    //             await this.mockBEP.approve(this.lottery.address, ether('10'), { from: owner });
    //             await this.lottery.buy(ether("1"), [1, 2, 3, 4], {from: owner})
    //         })
    //     })
    // })

    // commented to make tests run faster
    // uncomment to run
    // describe('#lotteryNFT.newLotteryItem', ()=>{
    //     describe('success', ()=>{
    //         it('creating the new lottery item', async () => {
    //             await this.lotteryNFT.newLotteryItem(owner, [1, 2, 3, 4], "1", "1", {from: owner})
    //         })
    //     })
    // })
});
