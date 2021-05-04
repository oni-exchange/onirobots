#!/bin/bash
if [ -z $1 ]; then
  truffle run verify OniProfile --network bsctestnet
  truffle run verify IFO --network bsctestnet
  truffle run verify PointCenterIFO --network bsctestnet
  truffle run verify TradingCompV1 --network bsctestnet
  truffle run verify OniRobots --network bsctestnet
  truffle run verify RobotMintingStation --network bsctestnet
  truffle run verify RobotFactoryV2 --network bsctestnet
  truffle run verify RobotFactoryV3 --network bsctestnet
  truffle run verify ClaimBackOni --network bsctestnet
  truffle run verify RobotSpecialV1 --network bsctestnet
else
  if [ -z $2 ]; then
    truffle run verify $1 --network bsctestnet
  else
    if [[ $1 = "all" ]]; then
      truffle run verify OniProfile --network $2
      truffle run verify IFO --network $2
      truffle run verify PointCenterIFO --network $2
      truffle run verify TradingCompV1 --network $2
      truffle run verify OniRobots --network $2
      truffle run verify RobotMintingStation --network $2
      truffle run verify RobotFactoryV2 --network $2
      truffle run verify RobotFactoryV3 --network $2
      truffle run verify ClaimBackOni --network $2
      truffle run verify RobotSpecialV1 --network $2
    else
      truffle run verify $1 --network $2
    fi
  fi
fi
