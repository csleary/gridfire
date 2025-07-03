import GridfireEditions from "@gridfire/hardhat/abi/GridfireEditions.json" with { type: "json" };
import GridfirePayment from "@gridfire/hardhat/abi/GridfirePayment.json" with { type: "json" };
import daiAbi from '@gridfire/shared/abi/dai';
import { Contract as IContract, Provider } from "@gridfire/shared/types";
import assert from "node:assert/strict";

const {
  API_KEY_1RPC,
  API_KEY_ALCHEMY,
  API_KEY_CHAINNODES,
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
assert(hasKey(API_KEY_CHAINNODES), "API_KEY_CHAINNODES env var missing.");
assert(hasKey(API_KEY_QUICKNODE), "API_KEY_QUICKNODE env var missing.");

export enum EventNames {
  APPROVAL = "Approval",
  CLAIM = "Claim",
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

const contracts: IContract[] = [
  {
    address: DAI_CONTRACT_ADDRESS,
    abi: daiAbi,
    events: [[EventNames.APPROVAL,[null, GRIDFIRE_PAYMENT_ADDRESS]]],
  },
  {
    address: GRIDFIRE_EDITIONS_ADDRESS,
    abi: GridfireEditions.abi,
    events: [[EventNames.EDITION_MINTED], [EventNames.PURCHASE_EDITION]],
  },
  {
    address: GRIDFIRE_PAYMENT_ADDRESS,
    abi: GridfirePayment.abi,
    events: [[EventNames.CLAIM], [EventNames.PURCHASE]],
  }
];

const contractEvents = (contracts.flatMap(c => c.events.map(([name]) => name)).sort());

export { contractEvents, contracts, PROVIDERS };
