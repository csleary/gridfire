import logger from "@gridfire/api/controllers/logger";
import { DRPC, LOCALHOST, ONE_RPC, providers as rpcProviders } from "@gridfire/shared/web3/rpcProviders";
import { FallbackProvider, JsonRpcProvider } from "ethers";
import assert from "node:assert/strict";

const { API_KEY_1RPC, API_KEY_ALCHEMY, API_KEY_CHAINNODES, API_KEY_QUICKNODE, NODE_ENV } = process.env;

const hasKey = (key: string | undefined): boolean =>
  NODE_ENV !== "production" || (NODE_ENV === "production" && Boolean(key));

assert(hasKey(API_KEY_1RPC), "API_KEY_1RPC env var missing.");
assert(hasKey(API_KEY_ALCHEMY), "API_KEY_ALCHEMY env var missing.");
assert(hasKey(API_KEY_CHAINNODES), "API_KEY_CHAINNODES env var missing.");
assert(hasKey(API_KEY_QUICKNODE), "API_KEY_QUICKNODE env var missing.");

const eventProviders = new Map(
  [...rpcProviders].filter(([key]) => {
    if (NODE_ENV !== "development") return ![DRPC, LOCALHOST, ONE_RPC].includes(key);
    return key === LOCALHOST;
  })
);

const providers = Array.from(eventProviders).map(([, url], index) => {
  const options = { batchMaxSize: 20, pollingInterval: 8000 };
  const provider = new JsonRpcProvider(url, undefined, options);
  return { priority: index + 1, provider, weight: 1 };
});

const provider = new FallbackProvider(providers, undefined, { pollingInterval: 8000, quorum: 1 });
provider.on("error", logger.error);

export default provider;
