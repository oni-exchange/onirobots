// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
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
import "@openzeppelin/contracts/access/AccessControl.sol";

import "@oni-exchange/onilib/contracts/token/BEP20/IBEP20.sol";

import "./OniRobots.sol";
import "./RobotMintingStation.sol";
import "./RobotFactory.sol";
import "./utils/SafeBEP20.sol";


// File: contracts/RobotMintingStation.sol

/** @title RobotMintingStation.
@dev It is a contract that allow different factories to mint
Oni Collectibles/Robots.
*/

contract RobotMintingStation is AccessControl {
    OniRobots public oniRobots;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Modifier for minting roles
    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, _msgSender()), "Not a minting role");
        _;
    }

    // Modifier for admin roles
    modifier onlyOwner() {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Not an admin role");
        _;
    }

    constructor(OniRobots _oniRobots) public {
        oniRobots = _oniRobots;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /**
     * @dev Mint NFTs from the OniRobots contract.
     */
    function mintCollectible(
        address _tokenReceiver,
        string calldata _tokenURI,
        uint8 _robotId
    ) external onlyMinter returns (uint256) {
        uint256 tokenId =
            oniRobots.mint(_tokenReceiver, _tokenURI, _robotId);
        return tokenId;
    }

    /**
     * @dev Set up names for robots.
     * Only the main admins can set it.
     */
    function setRobotName(uint8 _robotId, string calldata _robotName)
        external
        onlyOwner
    {
        oniRobots.setRobotName(_robotId, _robotName);
    }

    /**
     * @dev It transfers the ownership of the NFT contract
     * to a new address.
     * Only the main admins can set it.
     */
    function changeOwnershipNFTContract(address _newOwner) external onlyOwner {
        oniRobots.transferOwnership(_newOwner);
    }
}


contract RobotFactoryV3 is Ownable {
    using SafeMath for uint256;
    using SafeBEP20 for IBEP20;

    RobotFactoryV2 public robotFactoryV2;
    RobotMintingStation public robotMintingStation;

    IBEP20 public oniToken;

    // starting block
    uint256 public startBlockNumber;

    // Number of ONIs a user needs to pay to acquire a token
    uint256 public tokenPrice;

    // Map if address has already claimed a NFT
    mapping(address => bool) public hasClaimed;

    // IPFS hash for new json
    string private ipfsHash;

    // number of total series (i.e. different visuals)
    uint8 private constant numberRobotIds = 10;

    // number of previous series (i.e. different visuals)
    uint8 private constant previousNumberRobotIds = 5;

    // Map the token number to URI
    mapping(uint8 => string) private robotIdURIs;

    // Event to notify when NFT is successfully minted
    event RobotMint(
        address indexed to,
        uint256 indexed tokenId,
        uint8 indexed robotId
    );

    constructor(
        RobotFactoryV2 _robotFactoryV2,
        RobotMintingStation _robotMintingStation,
        IBEP20 _oniToken,
        uint256 _tokenPrice,
        string memory _ipfsHash,
        uint256 _startBlockNumber
    ) public {
        robotFactoryV2 = _robotFactoryV2;
        robotMintingStation = _robotMintingStation;
        oniToken = _oniToken;
        tokenPrice = _tokenPrice;
        ipfsHash = _ipfsHash;
        startBlockNumber = _startBlockNumber;
    }

    /**
     * @dev Mint NFTs from the RobotMintingStation contract.
     * Users can specify what robotId they want to mint. Users can claim once.
     */
    function mintNFT(uint8 _robotId) external {
        address senderAddress = _msgSender();

        bool hasClaimedV2 = robotFactoryV2.hasClaimed(senderAddress);

        // Check if _msgSender() has claimed in previous factory
        require(!hasClaimedV2, "Has claimed in v2");
        // Check _msgSender() has not claimed
        require(!hasClaimed[senderAddress], "Has claimed");
        // Check block time is not too late
        require(block.number > startBlockNumber, "too early");
        // Check that the _robotId is within boundary:
        require(_robotId >= previousNumberRobotIds, "robotId too low");
        // Check that the _robotId is within boundary:
        require(_robotId < numberRobotIds, "robotId too high");

        // Update that _msgSender() has claimed
        hasClaimed[senderAddress] = true;

        // Send ONI tokens to this contract
        oniToken.safeTransferFrom(senderAddress, address(this), tokenPrice);

        string memory tokenURI = robotIdURIs[_robotId];

        uint256 tokenId =
            robotMintingStation.mintCollectible(
                senderAddress,
                tokenURI,
                _robotId
            );

        emit RobotMint(senderAddress, tokenId, _robotId);
    }

    /**
     * @dev It transfers the ONI tokens back to the chef address.
     * Only callable by the owner.
     */
    function claimFee(uint256 _amount) external onlyOwner {
        oniToken.safeTransfer(_msgSender(), _amount);
    }

    /**
     * @dev Set up json extensions for robots 5-9
     * Assign tokenURI to look for each robotId in the mint function
     * Only the owner can set it.
     */
    function setRobotJson(
        string calldata _robotId5Json,
        string calldata _robotId6Json,
        string calldata _robotId7Json,
        string calldata _robotId8Json,
        string calldata _robotId9Json
    ) external onlyOwner {
        robotIdURIs[5] = string(abi.encodePacked(ipfsHash, _robotId5Json));
        robotIdURIs[6] = string(abi.encodePacked(ipfsHash, _robotId6Json));
        robotIdURIs[7] = string(abi.encodePacked(ipfsHash, _robotId7Json));
        robotIdURIs[8] = string(abi.encodePacked(ipfsHash, _robotId8Json));
        robotIdURIs[9] = string(abi.encodePacked(ipfsHash, _robotId9Json));
    }

    /**
     * @dev Allow to set up the start number
     * Only the owner can set it.
     */
    function setStartBlockNumber(uint256 _newStartBlockNumber)
        external
        onlyOwner
    {
        require(_newStartBlockNumber > block.number, "too short");
        startBlockNumber = _newStartBlockNumber;
    }

    /**
     * @dev Allow to change the token price
     * Only the owner can set it.
     */
    function updateTokenPrice(uint256 _newTokenPrice) external onlyOwner {
        tokenPrice = _newTokenPrice;
    }

    function canMint(address userAddress) external view returns (bool) {
        if (
            (hasClaimed[userAddress]) ||
            (robotFactoryV2.hasClaimed(userAddress))
        ) {
            return false;
        } else {
            return true;
        }
    }
}