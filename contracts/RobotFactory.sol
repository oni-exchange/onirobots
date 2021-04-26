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

import "@oni-exchange/onilib/contracts/token/BEP20/IBEP20.sol";

import "./utils/SafeBEP20.sol";
import "./OniRobots.sol";


contract RobotFactoryV2 is Ownable {
    using SafeMath for uint256;
    using SafeBEP20 for IBEP20;

    OniRobots public oniRobots;
    IBEP20 public oniToken;

    // end block number to get collectibles
    uint256 public endBlockNumber;

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

    /**
     * @dev A maximum number of NFT tokens that is distributed by this contract
     * is defined as totalSupplyDistributed.
     */
    constructor(
        OniRobots _oniRobots,
        IBEP20 _oniToken,
        uint256 _tokenPrice,
        string memory _ipfsHash,
        uint256 _startBlockNumber,
        uint256 _endBlockNumber
    ) public {
        oniRobots = _oniRobots;
        oniToken = _oniToken;
        tokenPrice = _tokenPrice;
        ipfsHash = _ipfsHash;
        startBlockNumber = _startBlockNumber;
        endBlockNumber = _endBlockNumber;
    }

    /**
     * @dev Mint NFTs from the OniRobots contract.
     * Users can specify what robotId they want to mint. Users can claim once.
     * There is a limit on how many are distributed. It requires ONI balance to be > 0.
     */
    function mintNFT(uint8 _robotId) external {
        // Check _msgSender() has not claimed
        require(!hasClaimed[_msgSender()], "Has claimed");
        // Check block time is not too late
        require(block.number > startBlockNumber, "too early");
        // Check block time is not too late
        require(block.number < endBlockNumber, "too late");
        // Check that the _robotId is within boundary:
        require(_robotId >= previousNumberRobotIds, "robotId too low");
        // Check that the _robotId is within boundary:
        require(_robotId < numberRobotIds, "robotId too high");

        // Update that _msgSender() has claimed
        hasClaimed[_msgSender()] = true;

        // Send ONI tokens to this contract
        oniToken.safeTransferFrom(
            address(_msgSender()),
            address(this),
            tokenPrice
        );

        string memory tokenURI = robotIdURIs[_robotId];

        uint256 tokenId =
            oniRobots.mint(address(_msgSender()), tokenURI, _robotId);

        emit RobotMint(_msgSender(), tokenId, _robotId);
    }

    /**
     * @dev It transfers the ownership of the NFT contract
     * to a new address.
     */
    function changeOwnershipNFTContract(address _newOwner) external onlyOwner {
        oniRobots.transferOwnership(_newOwner);
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
     * @dev Set up names for robots 5-9
     * Only the owner can set it.
     */
    function setRobotNames(
        string calldata _robotId5,
        string calldata _robotId6,
        string calldata _robotId7,
        string calldata _robotId8,
        string calldata _robotId9
    ) external onlyOwner {
        oniRobots.setRobotName(5, _robotId5);
        oniRobots.setRobotName(6, _robotId6);
        oniRobots.setRobotName(7, _robotId7);
        oniRobots.setRobotName(8, _robotId8);
        oniRobots.setRobotName(9, _robotId9);
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
     * @dev Allow to set up the end block number
     * Only the owner can set it.
     */
    function setEndBlockNumber(uint256 _newEndBlockNumber) external onlyOwner {
        require(_newEndBlockNumber > block.number, "too short");
        require(
            _newEndBlockNumber > startBlockNumber,
            "must be > startBlockNumber"
        );
        endBlockNumber = _newEndBlockNumber;
    }

    /**
     * @dev Allow to change the token price
     * Only the owner can set it.
     */
    function updateTokenPrice(uint256 _newTokenPrice) external onlyOwner {
        tokenPrice = _newTokenPrice;
    }
}

// File: @openzeppelin/contracts/access/AccessControl.sol

pragma solidity >=0.6.0 <0.8.0;

/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it.
 */
abstract contract AccessControl is Context {
    using EnumerableSet for EnumerableSet.AddressSet;
    using Address for address;

    struct RoleData {
        EnumerableSet.AddressSet members;
        bytes32 adminRole;
    }

    mapping(bytes32 => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted signaling this.
     *
     * _Available since v3.1._
     */
    event RoleAdminChanged(
        bytes32 indexed role,
        bytes32 indexed previousAdminRole,
        bytes32 indexed newAdminRole
    );

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call, an admin role
     * bearer except when using {_setupRole}.
     */
    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _roles[role].members.contains(account);
    }

    /**
     * @dev Returns the number of accounts that have `role`. Can be used
     * together with {getRoleMember} to enumerate all bearers of a role.
     */
    function getRoleMemberCount(bytes32 role) public view returns (uint256) {
        return _roles[role].members.length();
    }

    /**
     * @dev Returns one of the accounts that have `role`. `index` must be a
     * value between 0 and {getRoleMemberCount}, non-inclusive.
     *
     * Role bearers are not sorted in any particular way, and their ordering may
     * change at any point.
     *
     * WARNING: When using {getRoleMember} and {getRoleMemberCount}, make sure
     * you perform all queries on the same block. See the following
     * https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post]
     * for more information.
     */
    function getRoleMember(bytes32 role, uint256 index)
        public
        view
        returns (address)
    {
        return _roles[role].members.at(index);
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view returns (bytes32) {
        return _roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) public virtual {
        require(
            hasRole(_roles[role].adminRole, _msgSender()),
            "AccessControl: sender must be an admin to grant"
        );

        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) public virtual {
        require(
            hasRole(_roles[role].adminRole, _msgSender()),
            "AccessControl: sender must be an admin to revoke"
        );

        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `account`.
     */
    function renounceRole(bytes32 role, address account) public virtual {
        require(
            account == _msgSender(),
            "AccessControl: can only renounce roles for self"
        );

        _revokeRole(role, account);
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event. Note that unlike {grantRole}, this function doesn't perform any
     * checks on the calling account.
     *
     * [WARNING]
     * ====
     * This function should only be called from the constructor when setting
     * up the initial roles for the system.
     *
     * Using this function in any other way is effectively circumventing the admin
     * system imposed by {AccessControl}.
     * ====
     */
    function _setupRole(bytes32 role, address account) internal virtual {
        _grantRole(role, account);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        emit RoleAdminChanged(role, _roles[role].adminRole, adminRole);
        _roles[role].adminRole = adminRole;
    }

    function _grantRole(bytes32 role, address account) private {
        if (_roles[role].members.add(account)) {
            emit RoleGranted(role, account, _msgSender());
        }
    }

    function _revokeRole(bytes32 role, address account) private {
        if (_roles[role].members.remove(account)) {
            emit RoleRevoked(role, account, _msgSender());
        }
    }
}

// File: contracts/RobotMintingStation.sol

pragma solidity ^0.6.0;

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

// File: contracts/RobotFactory.sol

pragma solidity ^0.6.12;

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