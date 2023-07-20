// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { LibDiamond as ds } from "../libraries/LibDiamond.sol";

contract OwnershipFacet {

    modifier onlyRole(bytes32 role) {
        ds._checkRole(role);
        _;
    }

    function grantRole(bytes32 role, address account) public  onlyRole(ds.getRoleAdmin(role)) {
        ds._grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public  onlyRole(ds.getRoleAdmin(role)) {
        ds._revokeRole(role, account);
    }

    function renounceRole(bytes32 role, address account) public {
        require(account == ds._msgSender(), "can only renounce roles for self");
        ds._revokeRole(role, account);
    }
}
