//const { expectRevert, time, ether, expectEvent } = require('@openzeppelin/test-helpers');
//const Lottery = artifacts.require('Lottery');
//const MockBEP20 = artifacts.require('MockBEP20');
//const LotteryNFT = artifacts.require('LotteryNFT');
//const LotteryUpgradeProxy = artifacts.require('LotteryUpgradeProxy');
//const OniProfile = artifacts.require('OniProfile');
//
//
//contract('OniProfile',([owner, proxyAdmin, alice, bob, carol]) => {
//    beforeEach(async () => {
//        this.mockBEP = await MockBEP20.new('Oniswap', 'ONI', ether('1000000000'), {from: owner});
//        console.log('mockBEP: ', this.mockBEP.address)
//        this.lotteryNFT = await LotteryNFT.new();
//        console.log('lotteryNFT: ', this.lotteryNFT.address)
//        this.lottery = await Lottery.new();
//        const abiEncodeData = web3.eth.abi.encodeFunctionCall({
//            'inputs': [
//                {
//                    'internalType': 'contract IERC20',
//                    'name': '_oni',
//                    'type': 'address'
//                },
//                {
//                    'internalType': 'contract LotteryNFT',
//                    'name': '_lottery',
//                    'type': 'address'
//                },
//                {
//                    'internalType': 'uint256',
//                    'name': '_minPrice',
//                    'type': 'uint256'
//                },
//                {
//                    'internalType': 'uint8',
//                    'name': '_maxNumber',
//                    'type': 'uint8'
//                },
//                {
//                    'internalType': 'address',
//                    'name': '_owner',
//                    'type': 'address'
//                },
//                {
//                    'internalType': 'address',
//                    'name': '_adminAddress',
//                    'type': 'address'
//                }
//            ],
//            'name': 'initialize',
//            'outputs': [],
//            'stateMutability': 'nonpayable',
//            'type': 'function'
//        }, [this.mockBEP.address, this.lotteryNFT.address, ether('0.001'), 10, owner, owner]);
//
//        this.proxyInstance = await LotteryUpgradeProxy.new(this.lottery.address, proxyAdmin, abiEncodeData);
//        this.lotteryProxyAddress = this.proxyInstance.address;
//        this.lottery = await Lottery.at(this.proxyInstance.address);
//        console.log('lottery: ', this.lottery.address)
//        this.oni_profile = await OniProfile.new(this.mockBEP.address, ether('0.001'), ether('0.001'), ether('0.001'), {from: owner})
//        console.log('oni_profile: ', this.oni_profile.address)
//    });
//
//    // commented to make tests run faster
//    // uncomment to run
//    // it('test', async () => {
//    //   const minPrice = await this.lottery.minPrice.call();
//    //   // console.log('minPrice',  minPrice.toString());
//    // });
//
//    // commented to make tests run faster
//    // uncomment to run
//    // describe('#addTeam', () => {
//    //     describe('failure', () => {
//    //         it('reverts when name is too short', async () => {
//    //             await expectRevert(this.oni_profile.addTeam('T', 'It is the best team ever', {from: owner}), 'Must be > 3');
//    //         });
//    //
//    //         it('reverts when name is too long', async () => {
//    //             await expectRevert(this.oni_profile.addTeam('TeamTeamTeamTeamTeamTeam', 'It is the best team ever', {from: owner}), 'Must be < 20');
//    //         });
//    //
//    //         it('reverts when requester is not admin', async () => {
//    //             await expectRevert(this.oni_profile.addTeam('Team', 'It is the best team ever', {from: alice}), 'Not the main admin');
//    //         });
//    //     });
//    //
//    //     describe('success', () => {
//    //         it('emits a TeamAdd event', async () => {
//    //             const result = await this.oni_profile.addTeam('Team', 'It is the best team ever', {from: owner});
//    //             await expectEvent.inTransaction(result.tx, this.oni_profile, 'TeamAdd');
//    //         });
//    //     });
//    // });
//
//
//    // commented to make tests run faster
//    // uncomment to run
//    // describe('#addNftAddress', ()=>{
//    //     describe('success', ()=>{
//    //         it('adding nft contract address', async ()=>{
//    //             await this.oni_profile.addNftAddress(this.lotteryNFT.address);
//    //         })
//    //     })
//    // })
//    //
//    // describe('#createProfile', ()=>{
//    //     describe('failure', () => {
//    //         it('reverts if Invalid teamId', async () => {
//    //             await expectRevert(this.oni_profile.createProfile('1', owner, '1'), 'Invalid teamId');
//    //         });
//    //         it('reverts if NFT address invalid', async () => {
//    //             await this.oni_profile.addTeam('Team', 'It is the best team ever', {from: owner});
//    //             await expectRevert(this.oni_profile.createProfile('1', owner, '1'), 'NFT address invalid');
//    //         });
//    //     });
//    //     describe('success', () => {
//    //         it('creates a new profile', async () => {
//    //             await this.oni_profile.addTeam('Team', 'It is the best team ever', {from: owner});
//    //             await this.oni_profile.addNftAddress(this.lotteryNFT.address);
//    //             await this.lotteryNFT.transferOwnership(this.lottery.address);
//    //             await this.mockBEP.approve(this.lottery.address, ether('10'), { from: owner });
//    //             await this.lottery.buy(ether('1'), [1, 2, 3, 4], {from: owner});
//    //             await this.mockBEP.approve(this.oni_profile.address, ether('10'), { from: owner });
//    //             await this.lotteryNFT.approve(this.oni_profile.address, '1', { from: owner });
//    //
//    //             await this.oni_profile.createProfile('1', this.lotteryNFT.address, '1', {from: owner});
//    //         });
//    //     });
//    // });
//    // describe('#pauseProfile', ()=>{
//    //     describe('success', () => {
//    //         it('pauses a profile', async () => {
//    //             await this.oni_profile.addTeam('Team', 'It is the best team ever', {from: owner});
//    //             await this.oni_profile.addNftAddress(this.lotteryNFT.address);
//    //             await this.lotteryNFT.transferOwnership(this.lottery.address);
//    //             await this.mockBEP.approve(this.lottery.address, ether('10'), { from: owner });
//    //             await this.lottery.buy(ether('1'), [1, 2, 3, 4], {from: owner});
//    //             await this.mockBEP.approve(this.oni_profile.address, ether('10'), { from: owner });
//    //             await this.lotteryNFT.approve(this.oni_profile.address, '1', { from: owner });
//    //             await this.oni_profile.createProfile('1', this.lotteryNFT.address, '1', {from: owner});
//    //
//    //             await this.oni_profile.pauseProfile({from: owner});
//    //         });
//    //     });
//    //     describe('failure', () => {
//    //         it('reverts if User not active', async () => {
//    //             await this.oni_profile.addTeam('Team', 'It is the best team ever', {from: owner});
//    //             await this.oni_profile.addNftAddress(this.lotteryNFT.address);
//    //             await this.lotteryNFT.transferOwnership(this.lottery.address);
//    //             await this.mockBEP.approve(this.lottery.address, ether('10'), { from: owner });
//    //             await this.lottery.buy(ether('1'), [1, 2, 3, 4], {from: owner});
//    //             await this.mockBEP.approve(this.oni_profile.address, ether('10'), { from: owner });
//    //             await this.lotteryNFT.approve(this.oni_profile.address, '1', { from: owner });
//    //             await this.oni_profile.createProfile('1', this.lotteryNFT.address, '1', {from: owner});
//    //
//    //             await this.oni_profile.pauseProfile({from: owner});
//    //             await expectRevert(this.oni_profile.pauseProfile({from: owner}), 'User not active');
//    //         });
//    //         it('reverts if Has not registered', async () => {
//    //               await expectRevert(this.oni_profile.pauseProfile({from: owner}), 'Has not registered');
//    //         });
//    //     });
//    // });
//
//    // commented to make tests run faster
//    // uncomment to run
//    // describe('#lottery.buy and draw', () => {
//    //     describe('success', () => {
//    //         it('buying and draw', async () => {
//    //             await this.lotteryNFT.transferOwnership(this.lottery.address)
//    //
//    //             await this.mockBEP.approve(this.lottery.address, ether('100'), {from: alice});
//    //             await this.lottery.buy(ether('0.1'), [1, 2, 3, 4], {from: alice});
//    //             await this.mockBEP.approve(this.lottery.address, ether('100'), {from: bob});
//    //             await this.lottery.buy(ether('0.1'), [5, 7, 9, 3], {from: bob});
//    //             await this.mockBEP.approve(this.lottery.address, ether('100'), {from: carol});
//    //             await this.lottery.buy(ether('0.1'), [3, 7, 5, 1], {from: carol})
//    //
//    //             await this.lottery.drawing('1', {from: owner})
//    //
//    //             await this.lottery.claimReward('1', {from: alice})
//    //             await this.lottery.claimReward('2', {from: bob})
//    //             await this.lottery.claimReward('3', {from: carol})
//    //
//    //         })
//    //     })
//    // })
//
//    // commented to make tests run faster
//    // uncomment to run
//    describe('#lottery.buy and draw', () => {
//        describe('success', () => {
//            it('buying and drawing', async () => {
//                await this.lotteryNFT.transferOwnership(this.lottery.address)
//                await this.mockBEP.approve(this.lottery.address, ether('10'), {from: owner});
//                const balance = await this.mockBEP.balanceOf(this.lottery.address)
//                console.log(balance.toString())
//                await this.lottery.buy(ether('0.1'), [5, 6, 7, 8], {from: owner})
//                const balance1 = await this.mockBEP.balanceOf(this.lottery.address)
//                console.log(balance1.toString())
//                await this.lottery.buy(ether('0.1'), [1, 2, 3, 4], {from: owner})
//                const balance2 = await this.mockBEP.balanceOf(this.lottery.address)
//                console.log(balance2.toString())
//
//                await this.lottery.enterDrawingPhase({from: owner})
//                await this.lottery.drawing('27', {from: owner})
//                console.log(await this.lottery.drawed({from: owner}))
//                const issueIndex = await this.lottery.issueIndex.call()
//                console.log('issueIndex: ', issueIndex.toString())
//
//                const getRewardView1 = await this.lottery.getRewardView('1', {from: owner})
//                console.log('getRewardView1: ', getRewardView1.toString())
//                const claimRewardResult1 = await this.lottery.claimReward('1', {from: owner})
//                await expectEvent.inTransaction(claimRewardResult1.tx, this.lottery, 'Claim');
//                const getRewardView2 = await this.lottery.getRewardView('1', {from: owner})
//                const claimRewardResult2 = await this.lottery.claimReward('2', {from: owner})
//                console.log('getRewardView2: ', getRewardView2.toString())
//                await expectEvent.inTransaction(claimRewardResult2.tx, this.lottery, 'Claim');
//                const balance5 = await this.mockBEP.balanceOf(this.lottery.address)
//                console.log(balance5.toString())
//                console.log((await this.lottery.winningNumbers('0')).toString());
//                console.log((await this.lottery.winningNumbers('1')).toString());
//                console.log((await this.lottery.winningNumbers('2')).toString());
//                console.log((await this.lottery.winningNumbers('3')).toString());
//
//            })
//        })
//    })
//    // commented to make tests run faster
//    // uncomment to run
//    // describe('#lotteryNFT.newLotteryItem', ()=>{
//    //     describe('success', ()=>{
//    //         it('creating the new lottery item', async () => {
//    //             await this.lotteryNFT.newLotteryItem(owner, [1, 2, 3, 4], '1', '1', {from: owner})
//    //         })
//    //     })
//    // })
//});
