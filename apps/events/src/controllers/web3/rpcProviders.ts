import GridfireEditions from "@gridfire/hardhat/abi/GridfireEditions.json" with { type: "json" };
import GridfirePayment from "@gridfire/hardhat/abi/GridfirePayment.json" with { type: "json" };
import { Contract, Provider } from "@gridfire/shared/types";
import assert from "node:assert/strict";

const {
  API_KEY_1RPC,
  API_KEY_ALCHEMY,
  API_KEY_CHAINNODES,
  API_KEY_QUICKNODE,
  GRIDFIRE_EDITIONS_ADDRESS,
  GRIDFIRE_PAYMENT_ADDRESS,
  NODE_ENV
} = process.env;

const hasKey = (key: string | undefined): boolean =>
  NODE_ENV !== "production" || (NODE_ENV === "production" && Boolean(key));

assert(GRIDFIRE_EDITIONS_ADDRESS, "GRIDFIRE_EDITIONS_ADDRESS env var missing.");
assert(GRIDFIRE_PAYMENT_ADDRESS, "GRIDFIRE_PAYMENT_ADDRESS env var missing.");
assert(hasKey(API_KEY_1RPC), "API_KEY_1RPC env var missing.");
assert(hasKey(API_KEY_ALCHEMY), "API_KEY_ALCHEMY env var missing.");
assert(hasKey(API_KEY_CHAINNODES), "API_KEY_CHAINNODES env var missing.");
assert(hasKey(API_KEY_QUICKNODE), "API_KEY_QUICKNODE env var missing.");

export enum EventNames {
  EDITION_MINTED = "EditionMinted",
  PURCHASE_EDITION = "PurchaseEdition",
  PURCHASE = "Purchase"
}

const ALCHEMY = Symbol("alchemy");
const CHAINNODES = Symbol("chainnodes");
const LOCALHOST = Symbol("localhost");
const QUIKNODE = Symbol("quiknode");
const ONE_RPC = Symbol("1rpc");

const PROVIDERS: Provider[] =
  NODE_ENV === "production"
    ? [
        [ALCHEMY, `https://arb-mainnet.g.alchemy.com/v2/${API_KEY_ALCHEMY}`],
        [CHAINNODES, `https://arbitrum-one.chainnodes.org/${API_KEY_CHAINNODES}`],
        [QUIKNODE, `https://prettiest-few-darkness.arbitrum-mainnet.discover.quiknode.pro/${API_KEY_QUICKNODE}/`]
        // [ONE_RPC, `https://1rpc.io/${API_KEY_1RPC}/arb`]
      ]
    : [[LOCALHOST, "http://localhost:8545"]];

const contracts: Contract[] = [
  {
    address: GRIDFIRE_EDITIONS_ADDRESS,
    abi: GridfireEditions.abi,
    eventNames: [EventNames.EDITION_MINTED, EventNames.PURCHASE_EDITION]
  },
  {
    address: GRIDFIRE_PAYMENT_ADDRESS,
    abi: GridfirePayment.abi,
    eventNames: [EventNames.PURCHASE]
  }
];

export { contracts, PROVIDERS };

