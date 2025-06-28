const daiAbi = [
  {
    constant: true,
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" }
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { internalType: "address", name: "usr", type: "address" },
      { internalType: "uint256", name: "wad", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  }
];

const gridFireEditionsAbi = [
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
  }
];

const gridFirePaymentAbi = [
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

export { daiAbi, gridFireEditionsAbi, gridFirePaymentAbi };
