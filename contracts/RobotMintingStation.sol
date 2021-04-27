// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";

import "./OniRobots.sol";

/**
    @title RobotMintingStation.
    @dev It is a contract that allow different factories to mint Oni Collectibles/Robots.
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
