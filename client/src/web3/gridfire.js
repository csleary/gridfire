const gridFireAbi = [
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
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "Checkout",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "artist",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "Claim",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    name: "OwnershipTransferred",
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
        internalType: "string",
        name: "releaseId",
        type: "string"
      },
      {
        indexed: false,
        internalType: "string",
        name: "userId",
        type: "string"
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
        components: [
          {
            internalType: "address",
            name: "artist",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "amountPaid",
            type: "uint256"
          },
          {
            internalType: "string",
            name: "releaseId",
            type: "string"
          },
          {
            internalType: "uint256",
            name: "releasePrice",
            type: "uint256"
          }
        ],
        internalType: "struct GridFirePayment.BasketItem[]",
        name: "basket",
        type: "tuple[]"
      },
      {
        internalType: "string",
        name: "userId",
        type: "string"
      }
    ],
    name: "checkout",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "artist",
        type: "address"
      }
    ],
    name: "getBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getServiceFee",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "artist",
        type: "address"
      },
      {
        internalType: "string",
        name: "releaseId",
        type: "string"
      },
      {
        internalType: "string",
        name: "userId",
        type: "string"
      },
      {
        internalType: "uint256",
        name: "amountPaid",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "releasePrice",
        type: "uint256"
      }
    ],
    name: "purchase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "newServiceFee",
        type: "uint256"
      }
    ],
    name: "setServiceFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address"
      }
    ],
    name: "transferOwnership",
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
