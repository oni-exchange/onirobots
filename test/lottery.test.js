const { expectRevert, time } = require('@openzeppelin/test-helpers');
const Lottery = artifacts.require('Lottery');
const MockBEP20 = artifacts.require('MockBEP20');
const LotteryNFT = artifacts.require('LotteryNFT');
const LotteryUpgradeProxy = artifacts.require("LotteryUpgradeProxy");
const Initializable = artifacts.require("Initializable");

const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
const ether = (n) => web3.utils.toWei(n, 'ether');

contract('Lottery', (accounts) => {

    const minter = accounts[0];
    const alice = accounts[1];
    const bob = accounts[2];
    const carol = accounts[3];
    const dev = accounts[4];
    const proxyAdmin = accounts[5];
    const lotteryAdmin = accounts[6];

    var oni;
    var nft;
    var lottery;
    var lotteryProxy;
    var lotteryUpgradeProxy;

    beforeEach(async () => {

        oni = await MockBEP20.new("Mock BEP20", "MB20", '100000');
        nft = await LotteryNFT.new();
        lottery = await Lottery.new();

        const abiEncodeData = lottery.contract.methods.initialize(
            oni.address,
            nft.address,
            '1',
            '5',
            minter,
            lotteryAdmin
        ).encodeABI();

        lotteryUpgradeProxy = await LotteryUpgradeProxy.new(
          lottery.address,
          proxyAdmin,
          abiEncodeData
        );
        lotteryProxy = await Lottery.at(lotteryUpgradeProxy.address);

        await nft.transferOwnership(lotteryProxy.address);

        await oni.approve(bob, '2000');
        await oni.transfer(bob, '2000');

        await oni.approve(alice, '2000');
        await oni.transfer(alice, '2000');

        await oni.approve(carol, '2000');
        await oni.transfer(carol, '2000');
    });

    it('test', async () => {

        assert.equal((await nft.owner()).toString(), lotteryProxy.address);

        await oni.approve(lotteryProxy.address, '1000', { from: alice });
        await oni.approve(lotteryProxy.address, '1000', { from: bob });

        await lotteryProxy.buy('50', [1,3,4,3], {from: alice, gas: 4700000});
        await lotteryProxy.buy('100', [1,2,3,4], {from: alice, gas: 4700000 });
        await lotteryProxy.buy('50', [2,3,4,4], {from: alice, gas: 4700000 });
        await lotteryProxy.buy('50', [1,1,3,4], {from: bob, gas: 4700000 });
        await lotteryProxy.buy('100', [2,1,4,3], {from: bob, gas: 4700000 });
        await lotteryProxy.buy('50', [1,3,4,3], {from: bob, gas: 4700000 });
        await lotteryProxy.multiBuy('1',
            [
              [1,3,4,3],[1,3,4,3],[1,2,2,3],
              [1,3,4,3],[1,3,4,3],[1,2,2,3],
              [1,3,4,3],[1,3,4,3],[1,2,2,3],
              [1,3,4,3],[1,3,4,3],[1,2,2,3],
              [1,3,4,3],[1,3,4,3],[1,2,2,3],
              [1,3,4,3],[1,3,4,3],[1,2,2,3]
            ],
            {from: bob, gas: 8000000}
        );

        assert.equal((await oni.balanceOf(lotteryProxy.address)).toString(), '418');
        assert.equal((await lotteryProxy.totalAddresses()).toString(), '2');
        assert.equal((await nft.tokenOfOwnerByIndex(bob, 1)).toString(), '5');
        assert.equal((await nft.tokenOfOwnerByIndex(alice, 0)).toString(), '1');
        assert.equal((await lotteryProxy.getTotalRewards(0, {from: alice})).toString(), '418');
        await expectRevert(
            nft.tokenOfOwnerByIndex(alice, 3),
            'index out of bounds',
        );
        const externalRandomNumber = '1997';

        await expectRevert(
            lotteryProxy.drawing(externalRandomNumber, {from: bob, gas: 4700000}),
            'admin: wut?',
        );

        await lotteryProxy.enterDrawingPhase({from: lotteryAdmin});

        await lotteryProxy.drawing(externalRandomNumber, {from: lotteryAdmin});
        assert.equal((await lotteryProxy.issueIndex()).toString(), '0');

        await lotteryProxy.multiClaim([4,5,6,7], {from: bob, gas: 10000000});
        await lotteryProxy.multiClaim([8,9,10,11], {from: bob, gas: 10000000});
        await lotteryProxy.multiClaim([12,13,14,15], {from: bob, gas: 10000000});
        await lotteryProxy.multiClaim([16,17,18,19], {from: bob, gas: 10000000});
        await lotteryProxy.reset({from: lotteryAdmin, gas: 10000000});

        await lotteryProxy.claimReward(1, {from: alice, gas: 4700000});
        await lotteryProxy.claimReward(2, {from: alice, gas: 4700000});
        await lotteryProxy.claimReward(3, {from: alice, gas: 4700000});


        // console.log('reward:', (await lottery.getRewardView(tikeckIndex, {from: alice})).toString())
        // console.log('cake2:', (await oni.balanceOf(alice, {from: alice})).toString());
        // console.log((await nft.getClaimStatus(tikeckIndex, {from: alice})));

        // await expectRevert(lottery.claimReward(tikeckIndex, {from: alice}), 'claimed');

        // await lottery.reset({from: alice});

        // assert.equal((await lottery.issueIndex()), '1');

        // console.log((await lottery.historyNumbers(0, 1, {from: alice})).toString());

        // console.log((await lottery.getTotalRewards(1, {from: alice})).toString());

        // await lottery.buy('50', [1,3,4,3], {from: alice });
        // await lottery.buy('100', [1,2,4,3], {from: alice });
        // await lottery.buy('50', [2,3,4,4], {from: alice });
        // await lottery.buy('50', [1,1,3,4], {from: bob });
        // await lottery.buy('100', [2,1,4,3], {from: bob });
        // await lottery.buy('50', [1,3,4,3], {from: bob });

        // console.log((await lottery.getTotalRewards(0, {from: alice})).toString());
        // console.log((await lottery.getTotalRewards(1, {from: alice})).toString());

        // await lottery.drawing({from: alice});
        // for(let i= 0;i<4;i++) {
        //     console.log((await lottery.winningNumbers(i)).toString())
        // }
        // console.log((await lottery.getMatchingLotteries(1, 4, 0)).toString())
        // console.log((await lottery.getMatchingLotteries(1, 3, 0)).toString())
        // console.log((await lottery.getMatchingLotteries(1, 2, 0)).toString())
        // assert.equal((await lottery.winningNumbers()).toString(), '1');

        // assert.equal((await lottery.userInfo(alice, 0)).lotteryNumber1, '1');
        // assert.equal((await lottery.issueIndex()), '1');
        // // assert.equal((await lottery.lotteryInfo).length(), '1');

        // await lottery.drawing({from: alice });

        // console.log(await lottery.winningNumbers(0))

        // assert.equal((await lottery.historyNumbers(0,0)).toString(), (await lottery.winningNumbers(0)).toString());

        // assert.equal((await lottery.userInfo(alice, 0)).lotteryNumber1, '1');

        // await lottery.buy('5', [1,3,4,3], {from: bob });

        // console.log((await nft.tokenOfOwnerByIndex(bob, 0, {from: bob })).toString())
        // console.log((await nft.tokenOfOwnerByIndex(alice, 0, {from: bob })).toString())

    });

});
