const gridFireAbi = [
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
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "from",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "Received",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256"
      },
      {
        internalType: "string",
        name: "metadataUri",
        type: "string"
      },
      {
        internalType: "bytes32",
        name: "releaseId",
        type: "bytes32"
      },
      {
        internalType: "bytes32",
        name: "objectId",
        type: "bytes32"
      }
    ],
    name: "mintEdition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "editionId",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "amountPaid",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "paymentAddress",
        type: "address"
      },
      {
        internalType: "bytes32",
        name: "releaseId",
        type: "bytes32"
      }
    ],
    name: "purchaseGridfireEdition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    stateMutability: "payable",
    type: "receive"
  }
];

export default gridFireAbi;
