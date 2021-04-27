pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract OniRobots is ERC721, Ownable {
    using Counters for Counters.Counter;

    // Map the number of tokens per robotId
    mapping(uint8 => uint256) public robotCount;

    // Map the number of tokens burnt per robotId
    mapping(uint8 => uint256) public robotBurnCount;

    // Used for generating the tokenId of new NFT minted
    Counters.Counter private _tokenIds;

    // Map the robotId for each tokenId
    mapping(uint256 => uint8) private robotIds;

    // Map the robotName for a tokenId
    mapping(uint8 => string) private robotNames;

    constructor(string memory _baseURI) public ERC721("Oniswap Robots", "OR") {
        _setBaseURI(_baseURI);
    }

    /**
     * @dev Get robotId for a specific tokenId.
     */
    function getRobotId(uint256 _tokenId) external view returns (uint8) {
        return robotIds[_tokenId];
    }

    /**
     * @dev Get the associated robotName for a specific robotId.
     */
    function getRobotName(uint8 _robotId)
        external
        view
        returns (string memory)
    {
        return robotNames[_robotId];
    }

    /**
     * @dev Get the associated robotName for a unique tokenId.
     */
    function getRobotNameOfTokenId(uint256 _tokenId)
        external
        view
        returns (string memory)
    {
        uint8 robotId = robotIds[_tokenId];
        return robotNames[robotId];
    }

    /**
     * @dev Mint NFTs. Only the owner can call it.
     */
    function mint(
        address _to,
        string calldata _tokenURI,
        uint8 _robotId
    ) external onlyOwner returns (uint256) {
        uint256 newId = _tokenIds.current();
        _tokenIds.increment();
        robotIds[newId] = _robotId;
        robotCount[_robotId] = robotCount[_robotId].add(1);
        _mint(_to, newId);
        _setTokenURI(newId, _tokenURI);
        return newId;
    }

    /**
     * @dev Set a unique name for each robotId. It is supposed to be called once.
     */
    function setRobotName(uint8 _robotId, string calldata _name)
        external
        onlyOwner
    {
        robotNames[_robotId] = _name;
    }

    /**
     * @dev Burn a NFT token. Callable by owner only.
     */
    function burn(uint256 _tokenId) external onlyOwner {
        uint8 robotIdBurnt = robotIds[_tokenId];
        robotCount[robotIdBurnt] = robotCount[robotIdBurnt].sub(1);
        robotBurnCount[robotIdBurnt] = robotBurnCount[robotIdBurnt].add(1);
        _burn(_tokenId);
    }
}