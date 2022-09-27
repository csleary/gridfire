const abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "releaseId",
        type: "bytes32"
      },
      {
        indexed: true,
        internalType: "address",
        name: "artist",
        type: "address"
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "objectId",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "editionId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256"
      }
    ],
    name: "EditionMinted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "buyer",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "artist",
        type: "address"
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "releaseId",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "userId",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountPaid",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "artistShare",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "platformFee",
        type: "uint256"
      }
    ],
    name: "Purchase",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "buyer",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "artist",
        type: "address"
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "editionId",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountPaid",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "artistShare",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "platformFee",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "releaseId",
        type: "bytes32"
      }
    ],
    name: "PurchaseEdition",
    type: "event"
  }
];

export default abi;
