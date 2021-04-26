pragma solidity ^0.6.12;

import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/EnumerableMap.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Holder.sol";

import "@oni-exchange/onilib/contracts/token/BEP20/IBEP20.sol";

// File: contracts/utils/SafeBEP20.sol

import "./OniProfile.sol";
import "./OniRobots.sol";
import "./RobotMintingStation.sol";

contract RobotSpecialV1 is Ownable {
    using SafeBEP20 for IBEP20;
    using SafeMath for uint256;

    RobotMintingStation public robotMintingStation;
    OniProfile public oniProfile;

    IBEP20 public cakeToken;

    uint256 public maxViewLength;
    uint256 public numberDifferentRobots;

    // Map if address for a robotId has already claimed a NFT
    mapping(address => mapping(uint8 => bool)) public hasClaimed;

    // Map if robotId to its characteristics
    mapping(uint8 => Robots) public robotCharacteristics;

    // Number of previous series (i.e. different visuals)
    uint8 private constant previousNumberRobotIds = 10;

    struct Robots {
        string tokenURI; // e.g. ipfsHash/hiccups.json
        uint256 thresholdUser; // e.g. 1900 or 100000
        uint256 cakeCost;
        bool isActive;
        bool isCreated;
    }

    // Event to notify a new robot is mintable
    event RobotAdd(
        uint8 indexed robotId,
        uint256 thresholdUser,
        uint256 costCake
    );

    // Event to notify one of the robots' requirements to mint differ
    event RobotChange(
        uint8 indexed robotId,
        uint256 thresholdUser,
        uint256 costCake,
        bool isActive
    );

    // Event to notify when NFT is successfully minted
    event RobotMint(
        address indexed to,
        uint256 indexed tokenId,
        uint8 indexed robotId
    );

    constructor(
        RobotMintingStation _robotMintingStation,
        IBEP20 _cakeToken,
        OniProfile _oniProfile,
        uint256 _maxViewLength
    ) public {
        robotMintingStation = _robotMintingStation;
        cakeToken = _cakeToken;
        oniProfile = _oniProfile;
        maxViewLength = _maxViewLength;
    }

    /**
     * @dev Mint NFTs from the RobotMintingStation contract.
     * Users can claim once.
     */
    function mintNFT(uint8 _robotId) external {
        // Check that the _robotId is within boundary
        require(_robotId >= previousNumberRobotIds, "ERR_ID_LOW");
        require(robotCharacteristics[_robotId].isActive, "ERR_ID_INVALID");

        address senderAddress = _msgSender();

        // 1. Check _msgSender() has not claimed
        require(!hasClaimed[senderAddress][_robotId], "ERR_HAS_CLAIMED");

        uint256 userId;
        bool isUserActive;

        (userId, , , , , isUserActive) = oniProfile.getUserProfile(
            senderAddress
        );

        require(
            userId < robotCharacteristics[_robotId].thresholdUser,
            "ERR_USER_NOT_ELIGIBLE"
        );

        require(isUserActive, "ERR_USER_NOT_ACTIVE");

        // Check if there is any cost associated with getting the robot
        if (robotCharacteristics[_robotId].cakeCost > 0) {
            cakeToken.safeTransferFrom(
                senderAddress,
                address(this),
                robotCharacteristics[_robotId].cakeCost
            );
        }

        // Update that _msgSender() has claimed
        hasClaimed[senderAddress][_robotId] = true;

        uint256 tokenId =
            robotMintingStation.mintCollectible(
                senderAddress,
                robotCharacteristics[_robotId].tokenURI,
                _robotId
            );

        emit RobotMint(senderAddress, tokenId, _robotId);
    }

    function addRobot(
        uint8 _robotId,
        string calldata _tokenURI,
        uint256 _thresholdUser,
        uint256 _cakeCost
    ) external onlyOwner {
        require(!robotCharacteristics[_robotId].isCreated, "ERR_CREATED");
        require(_robotId >= previousNumberRobotIds, "ERR_ID_LOW_2");

        robotCharacteristics[_robotId] = Robots({
            tokenURI: _tokenURI,
            thresholdUser: _thresholdUser,
            cakeCost: _cakeCost,
            isActive: true,
            isCreated: true
        });

        numberDifferentRobots = numberDifferentRobots.add(1);

        emit RobotAdd(_robotId, _thresholdUser, _cakeCost);
    }

    /**
     * @dev It transfers the CAKE tokens back to the chef address.
     * Only callable by the owner.
     */
    function claimFee(uint256 _amount) external onlyOwner {
        cakeToken.safeTransfer(_msgSender(), _amount);
    }

    function updateRobot(
        uint8 _robotId,
        uint256 _thresholdUser,
        uint256 _cakeCost,
        bool _isActive
    ) external onlyOwner {
        require(robotCharacteristics[_robotId].isCreated, "ERR_NOT_CREATED");
        robotCharacteristics[_robotId].thresholdUser = _thresholdUser;
        robotCharacteristics[_robotId].cakeCost = _cakeCost;
        robotCharacteristics[_robotId].isActive = _isActive;

        emit RobotChange(_robotId, _thresholdUser, _cakeCost, _isActive);
    }

    function updateMaxViewLength(uint256 _newMaxViewLength) external onlyOwner {
        maxViewLength = _newMaxViewLength;
    }

    function canClaimSingle(address _userAddress, uint8 _robotId)
        external
        view
        returns (bool)
    {
        if (!oniProfile.hasRegistered(_userAddress)) {
            return false;
        } else {
            uint256 userId;
            bool userStatus;

            (userId, , , , , userStatus) = oniProfile.getUserProfile(
                _userAddress
            );

            if (!userStatus) {
                return false;
            } else {
                bool claimStatus = _canClaim(_userAddress, userId, _robotId);
                return claimStatus;
            }
        }
    }

    function canClaimMultiple(address _userAddress, uint8[] calldata _robotIds)
        external
        view
        returns (bool[] memory)
    {
        require(_robotIds.length <= maxViewLength, "ERR_LENGTH_VIEW");

        if (!oniProfile.hasRegistered(_userAddress)) {
            bool[] memory responses = new bool[](0);
            return responses;
        } else {
            uint256 userId;
            bool userStatus;

            (userId, , , , , userStatus) = oniProfile.getUserProfile(
                _userAddress
            );

            if (!userStatus) {
                bool[] memory responses = new bool[](0);
                return responses;
            } else {
                bool[] memory responses = new bool[](_robotIds.length);

                for (uint256 i = 0; i < _robotIds.length; i++) {
                    bool claimStatus =
                        _canClaim(_userAddress, userId, _robotIds[i]);
                    responses[i] = claimStatus;
                }
                return responses;
            }
        }
    }

    /**
     * @dev Check if user can claim.
     * If the address hadn't set up a profile, it will return an error.
     */
    function _canClaim(
        address _userAddress,
        uint256 userId,
        uint8 _robotId
    ) internal view returns (bool) {
        uint256 robotThreshold = robotCharacteristics[_robotId].thresholdUser;
        bool robotActive = robotCharacteristics[_robotId].isActive;

        if (hasClaimed[_userAddress][_robotId]) {
            return false;
        } else if (!robotActive) {
            return false;
        } else if (userId >= robotThreshold) {
            return false;
        } else {
            return true;
        }
    }
}