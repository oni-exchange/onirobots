pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/EnumerableMap.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "@oni-exchange/onilib/contracts/token/BEP20/IBEP20.sol";
//import "@oni-exchange/onilib/contracts/token/BEP20/SafeBEP20.sol";

import "./IOniProfile.sol";
import "./OniRobots.sol";
import "./RobotMintingStation.sol";


/** @title TradingCompV1.
@notice It is a contract for users to collect points
based on off-chain events
*/
contract TradingCompV1 is Ownable {
    using SafeBEP20 for IBEP20;

    RobotMintingStation public robotMintingStation;
    IBEP20 public oniToken;
    IOniProfile public oniProfile;

    uint256 public constant numberTeams = 3;

    uint8 public robotId;
    uint256 public winningTeamId; // set to 0 as default
    string public tokenURI;

    enum CompetitionStatus {Registration, Open, Close, Claiming, Over}

    CompetitionStatus public currentStatus;

    mapping(address => UserStats) public userTradingStats;

    mapping(uint256 => CompetitionRewards) private _rewardCompetitions;

    struct CompetitionRewards {
        uint256[5] userCampaignId; // campaignId for user increase
        uint256[5] oniRewards; // oni rewards per group
        uint256[5] pointUsers; // number of points per user
    }

    struct UserStats {
        uint256 rewardGroup; // 0 to 4 --> 4 top / 0: bottom
        uint256 teamId; // 1 - 3
        bool hasRegistered; // true or false
        bool hasClaimed; // true or false
    }

    event NewCompetitionStatus(CompetitionStatus status);
    event TeamRewardsUpdate(uint256 teamId);
    event UserRegister(address userAddress, uint256 teamId);
    event UserUpdateMultiple(address[] userAddresses, uint256 rewardGroup);
    event WinningTeam(uint256 teamId);

    /**
     * @notice It initializes the contract.
     * @param _oniProfileAddress: OniProfile address
     * @param _robotStationAddress: RobotMintingStation address
     * @param _oniTokenAddress: the address of the ONI token
     */
    constructor(
        address _oniProfileAddress,
        address _robotStationAddress,
        address _oniTokenAddress
    ) public {
        oniProfile = IOniProfile(_oniProfileAddress);
        robotMintingStation = RobotMintingStation(_robotStationAddress);
        oniToken = IBEP20(_oniTokenAddress);
        currentStatus = CompetitionStatus.Registration;
    }

    /**
     * @notice It allows users to claim reward after the end of trading competition.
     * @dev It is only available during claiming phase
     */
    function claimReward() external {
        address senderAddress = _msgSender();

        require(userTradingStats[senderAddress].hasRegistered, "NOT_REGISTERED");
        require(!userTradingStats[senderAddress].hasClaimed, "HAS_CLAIMED");
        require(currentStatus == CompetitionStatus.Claiming, "NOT_IN_CLAIMING");

        userTradingStats[senderAddress].hasClaimed = true;

        uint256 userRewardGroup = userTradingStats[senderAddress].rewardGroup;
        uint256 userTeamId = userTradingStats[senderAddress].teamId;

        CompetitionRewards memory userRewards = _rewardCompetitions[userTeamId];

        if (userRewardGroup > 0) {
            oniToken.safeTransfer(senderAddress, userRewards.oniRewards[userRewardGroup]);

            if (userTeamId == winningTeamId) {
                robotMintingStation.mintCollectible(senderAddress, tokenURI, robotId);
            }
        }

        // User collects points
        oniProfile.increaseUserPoints(
            senderAddress,
            userRewards.pointUsers[userRewardGroup],
            userRewards.userCampaignId[userRewardGroup]
        );
    }

    /**
     * @notice It allows users to register for trading competition
     * @dev Only callable if the user has an active OniProfile.
     */
    function register() external {
        address senderAddress = _msgSender();

        // 1. Checks if user has registered
        require(!userTradingStats[senderAddress].hasRegistered, "HAS_REGISTERED");

        // 2. Check whether it is joinable
        require(currentStatus == CompetitionStatus.Registration, "NOT_IN_REGISTRATION");

        // 3. Check if active and records the teamId
        uint256 userTeamId;
        bool isUserActive;

        (, , userTeamId, , , isUserActive) = oniProfile.getUserProfile(senderAddress);

        require(isUserActive, "NOT_ACTIVE");

        // 4. Write in storage user stats for the registered user
        UserStats storage newUserStats = userTradingStats[senderAddress];
        newUserStats.teamId = userTeamId;
        newUserStats.hasRegistered = true;

        emit UserRegister(senderAddress, userTeamId);
    }

    /**
     * @notice It allows the owner to change the competition status
     * @dev Only callable by owner.
     * @param _status: CompetitionStatus (uint8)
     */
    function updateCompetitionStatus(CompetitionStatus _status) external onlyOwner {
        require(_status != CompetitionStatus.Registration, "IN_REGISTRATION");

        if (_status == CompetitionStatus.Open) {
            require(currentStatus == CompetitionStatus.Registration, "NOT_IN_REGISTRATION");
        } else if (_status == CompetitionStatus.Close) {
            require(currentStatus == CompetitionStatus.Open, "NOT_OPEN");
        } else if (_status == CompetitionStatus.Claiming) {
            require(winningTeamId > 0, "WINNING_TEAM_NOT_SET");
            require(currentStatus == CompetitionStatus.Close, "NOT_CLOSED");
        } else {
            require(currentStatus == CompetitionStatus.Claiming, "NOT_CLAIMING");
        }

        currentStatus = _status;

        emit NewCompetitionStatus(currentStatus);
    }

    /**
     * @notice It allows the owner to claim the ONI remainder
     * @dev Only callable by owner.
     * @param _amount: amount of ONI to withdraw (decimals = 18)
     */
    function claimRemainder(uint256 _amount) external onlyOwner {
        require(currentStatus == CompetitionStatus.Over, "NOT_OVER");
        oniToken.safeTransfer(_msgSender(), _amount);
    }

    /**
     * @notice It allows the owner to update team rewards
     * @dev Only callable by owner.
     * @param _teamId: the teamId
     * @param _userCampaignIds: campaignIds for each user group for teamId
     * @param _oniRewards: ONI rewards for each user group for teamId
     * @param _pointRewards: point to collect for each user group for teamId
     */
    function updateTeamRewards(
        uint256 _teamId,
        uint256[5] calldata _userCampaignIds,
        uint256[5] calldata _oniRewards,
        uint256[5] calldata _pointRewards
    ) external onlyOwner {
        require(currentStatus == CompetitionStatus.Close, "NOT_CLOSED");
        _rewardCompetitions[_teamId].userCampaignId = _userCampaignIds;
        _rewardCompetitions[_teamId].oniRewards = _oniRewards;
        _rewardCompetitions[_teamId].pointUsers = _pointRewards;

        emit TeamRewardsUpdate(_teamId);
    }

    /**
     * @notice It allows the owner to update user statuses
     * @dev Only callable by owner. Use with caution!
     * @param _addressesToUpdate: the array of addresses
     * @param _rewardGroup: the reward group
     */
    function updateUserStatusMultiple(address[] calldata _addressesToUpdate, uint256 _rewardGroup) external onlyOwner {
        require(currentStatus == CompetitionStatus.Close, "NOT_CLOSED");
        require(_rewardGroup <= 4, "TOO_HIGH");
        for (uint256 i = 0; i < _addressesToUpdate.length; i++) {
            userTradingStats[_addressesToUpdate[i]].rewardGroup = _rewardGroup;
        }

        emit UserUpdateMultiple(_addressesToUpdate, _rewardGroup);
    }

    /**
     * @notice It allows the owner to set the winning teamId (to collect NFT)
     * @dev Only callable by owner.
     * @param _winningTeamId: the winning teamId
     * @param _tokenURI: the tokenURI
     * @param _robotId: the robotId for winners (e.g. 15)
     */
    function updateWinningTeamAndTokenURIAndRobotId(
        uint256 _winningTeamId,
        string calldata _tokenURI,
        uint8 _robotId
    ) external onlyOwner {
        require(currentStatus == CompetitionStatus.Close, "NOT_CLOSED");
        require((_winningTeamId > 0) && (_winningTeamId <= numberTeams), "NOT_VALID_TEAM_ID");
        require(_robotId > 14, "ID_TOO_LOW");
        winningTeamId = _winningTeamId;
        tokenURI = _tokenURI;
        robotId = _robotId;
        emit WinningTeam(_winningTeamId);
    }

    /**
     * @notice It checks the claim information
     * @dev It does not check if user has a profile since registration required a profile.
     * @param _userAddress: the user address
     * @return hasRegistered: has the user registered
     * @return hasUserClaimed: whether user has claimed
     * @return userRewardGroup: the final reward group for each user (i.e. tier)
     * @return userOniRewards: the ONI to claim/claimed
     * @return userPointReward: the number of points to claim/claimed
     * @return canClaimNFT: whether the user gets/got a NFT
     */
    function claimInformation(address _userAddress)
        external
        view
        returns (
            bool,
            bool,
            uint256,
            uint256,
            uint256,
            bool
        )
    {
        bool hasUserRegistered = userTradingStats[_userAddress].hasRegistered;
        if ((currentStatus != CompetitionStatus.Claiming) && (currentStatus != CompetitionStatus.Over)) {
            return (hasUserRegistered, false, 0, 0, 0, false);
        } else if (!hasUserRegistered) {
            return (hasUserRegistered, false, 0, 0, 0, false);
        } else {
            uint256 userRewardGroup = userTradingStats[_userAddress].rewardGroup;
            uint256 userTeamId = userTradingStats[_userAddress].teamId;

            uint256 userOniRewards = _rewardCompetitions[userTeamId].oniRewards[userRewardGroup];
            uint256 userPointRewards = _rewardCompetitions[userTeamId].pointUsers[userRewardGroup];

            bool hasUserClaimed = userTradingStats[_userAddress].hasClaimed;
            bool canClaimNFT;

            if ((userTeamId == winningTeamId) && (userRewardGroup > 0)) {
                canClaimNFT = true;
            }

            return (hasUserRegistered, hasUserClaimed, userRewardGroup, userOniRewards, userPointRewards, canClaimNFT);
        }
    }

    /**
     * @notice It checks the reward groups for each team
     */
    function viewRewardTeams() external view returns (CompetitionRewards[] memory) {
        CompetitionRewards[] memory listCompetitionRewards = new CompetitionRewards[](numberTeams);
        for (uint256 i = 0; i < numberTeams; i++) {
            listCompetitionRewards[i] = _rewardCompetitions[i + 1];
        }
        return listCompetitionRewards;
    }
}