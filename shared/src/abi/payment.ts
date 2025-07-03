const gridFirePaymentAbi = [
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
            internalType: "bytes32",
            name: "releaseId",
            type: "bytes32"
          }
        ],
        internalType: "struct IGridfirePayment.BasketItem[]",
        name: "basket",
        type: "tuple[]"
      },
      {
        internalType: "bytes32",
        name: "userId",
        type: "bytes32"
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
    inputs: [
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
        internalType: "bytes32",
        name: "releaseId",
        type: "bytes32"
      },
      {
        internalType: "bytes32",
        name: "userId",
        type: "bytes32"
      }
    ],
    name: "purchase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

export default gridFirePaymentAbi;
