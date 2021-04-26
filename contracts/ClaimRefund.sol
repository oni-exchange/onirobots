// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Holder.sol";

import "@oni-exchange/onilib/contracts/token/BEP20/IBEP20.sol";

import "./utils/SafeBEP20.sol";
import "./OniProfile.sol";

contract ClaimBackOni is Ownable {
    using SafeBEP20 for IBEP20;

    IBEP20 public oniToken;
    OniProfile oniProfile;

    uint256 public numberOni;
    uint256 public thresholdUser;

    mapping(address => bool) public hasClaimed;

    constructor(
        IBEP20 _oniToken,
        address _oniProfileAddress,
        uint256 _numberOni,
        uint256 _thresholdUser
    ) public {
        oniToken = _oniToken;
        oniProfile = OniProfile(_oniProfileAddress);
        numberOni = _numberOni;
        thresholdUser = _thresholdUser;
    }

    function getOniBack() external {
        // 1. Check if she has registered
        require(oniProfile.hasRegistered(_msgSender()), "not active");

        // 2. Check if she has claimed
        require(!hasClaimed[_msgSender()], "has claimed ONI");

        // 3. Check if she is active
        uint256 userId;
        (userId, , , , , ) = oniProfile.getUserProfile(_msgSender());

        require(userId < thresholdUser, "not impacted");

        // Update status
        hasClaimed[_msgSender()] = true;

        // Transfer ONI tokens from this contract
        oniToken.safeTransfer(_msgSender(), numberOni);
    }

    /**
     * @dev Claim ONI back.
     * Callable only by owner admins.
     */
    function claimFee(uint256 _amount) external onlyOwner {
        oniToken.safeTransfer(_msgSender(), _amount);
    }

    function canClaim(address _userAddress) external view returns (bool) {
        if (!oniProfile.hasRegistered(_userAddress)) {
            return false;
        } else if (hasClaimed[_userAddress]) {
            return false;
        } else {
            uint256 userId;
            (userId, , , , , ) = oniProfile.getUserProfile(_userAddress);
            if (userId < thresholdUser) {
                return true;
            } else {
                return false;
            }
        }
    }
}