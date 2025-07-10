import daiAbi from "@gridfire/shared/abi/dai";
import editionsABI from "@gridfire/shared/abi/editions";
import paymentABI from "@gridfire/shared/abi/payment";
import { Contract as IContract, Provider } from "@gridfire/shared/types";
import assert from "node:assert/strict";

const {
  API_KEY_1RPC,
  API_KEY_ALCHEMY,
  API_KEY_CHAINNODES,
  API_KEY_DRPC,
  API_KEY_QUICKNODE,
  DAI_CONTRACT_ADDRESS,
  GRIDFIRE_EDITIONS_ADDRESS,
  GRIDFIRE_PAYMENT_ADDRESS,
  NODE_ENV
} = process.env;

const hasKey = (key: string | undefined): boolean =>
  NODE_ENV !== "production" || (NODE_ENV === "production" && Boolean(key));

assert(DAI_CONTRACT_ADDRESS, "DAI_CONTRACT_ADDRESS env var missing.");
assert(GRIDFIRE_EDITIONS_ADDRESS, "GRIDFIRE_EDITIONS_ADDRESS env var missing.");
assert(GRIDFIRE_PAYMENT_ADDRESS, "GRIDFIRE_PAYMENT_ADDRESS env var missing.");
assert(hasKey(API_KEY_1RPC), "API_KEY_1RPC env var missing.");
assert(hasKey(API_KEY_ALCHEMY), "API_KEY_ALCHEMY env var missing.");
assert(hasKey(API_KEY_DRPC), "API_KEY_DRPC env var missing.");
assert(hasKey(API_KEY_CHAINNODES), "API_KEY_CHAINNODES env var missing.");
assert(hasKey(API_KEY_QUICKNODE), "API_KEY_QUICKNODE env var missing.");

export enum EventNames {
  APPROVAL = "Approval",
  CLAIM = "Claim",
  EDITION_MINTED = "EditionMinted",
  PURCHASE_EDITION = "PurchaseEdition",
  PURCHASE = "Purchase",
  TRANSFER_SINGLE = "TransferSingle"
}

const ALCHEMY = Symbol("alchemy");
const CHAINNODES = Symbol("chainnodes");
const DRPC = Symbol("drpc");
const LOCALHOST = Symbol("localhost");
const ONE_RPC = Symbol("1rpc");
const QUICKNODE = Symbol("quiknode");
const ALLNODES = Symbol("allnodes");

const allProviders: Provider[] =
  NODE_ENV === "production"
    ? [
        [ALCHEMY, `https://arb-mainnet.g.alchemy.com/v2/${API_KEY_ALCHEMY}`],
        [ALLNODES, "https://arbitrum-one-rpc.publicnode.com"],
        [CHAINNODES, `https://arbitrum-one.chainnodes.org/${API_KEY_CHAINNODES}`],
        [QUICKNODE, `https://prettiest-few-darkness.arbitrum-mainnet.discover.quiknode.pro/${API_KEY_QUICKNODE}/`],
        [DRPC, `https://lb.drpc.org/arbitrum/${API_KEY_DRPC}`] // Limited to batches of 3. Just use for block numbers.
        // [ONE_RPC, `https://1rpc.io/${API_KEY_1RPC}/arb`] // Blacklisted/blocked?
      ]
    : [[LOCALHOST, "http://localhost:8545"]];

const contracts: IContract[] = [
  {
    address: DAI_CONTRACT_ADDRESS,
    abi: daiAbi,
    events: [[EventNames.APPROVAL, [null, GRIDFIRE_PAYMENT_ADDRESS]]]
  },
  {
    address: GRIDFIRE_EDITIONS_ADDRESS,
    abi: editionsABI,
    events: [[EventNames.EDITION_MINTED], [EventNames.PURCHASE_EDITION], [EventNames.TRANSFER_SINGLE]]
  },
  {
    address: GRIDFIRE_PAYMENT_ADDRESS,
    abi: paymentABI,
    events: [[EventNames.CLAIM], [EventNames.PURCHASE]]
  }
];

const blockProviders = allProviders;
const providers = allProviders.filter(([provider]) => ![DRPC].includes(provider));
export { blockProviders, contracts, providers };
