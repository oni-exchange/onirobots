#!/bin/bash

truffle compile --network bscTestnet

CD=`pwd`

ARTIFACTS=${CD}/build/contracts

# compile dependencies
cd ${CD}/node_modules/@oni-exchange/onifarm && npm run compile
cd ${CD}/node_modules/@oni-exchange/onilib && npm run compile
cd ${CD}/node_modules/@oni-exchange/onilottery && npm run compile

# copy artifacts required for deployment
cp -f ${CD}/node_modules/@oni-exchange/onifarm/build/contracts/{OniToken,SmartChef,MasterChef,SyrupBar,SousChef,Timelock,WBNB,BnbStaking,LotteryRewardPool,Multicall,OniVoterProxy,SafeBEP20}.json ${ARTIFACTS}
cp -f ${CD}/node_modules/@oni-exchange/onilottery/build/contracts/{LotteryNFT,LotteryOwnable,LotteryRewardProxy,Lottery,LotteryUpgradeProxy}.json ${ARTIFACTS}
