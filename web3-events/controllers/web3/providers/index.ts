// import { FallbackProvider, JsonRpcProvider, Network } from "ethers";
// import assert from "assert/strict";
// import logger from "gridfire-web3-events/controllers/logger.js";

// const { API_KEY_1RPC, API_KEY_ALCHEMY, API_KEY_CHAINNODES, API_KEY_QUICKNODE, NODE_ENV } = process.env;

// const hasKey = (key: string | undefined): boolean =>
//   NODE_ENV !== "production" || (NODE_ENV === "production" && Boolean(key));

// assert(hasKey(API_KEY_1RPC), "API_KEY_1RPC env var missing.");
// assert(hasKey(API_KEY_ALCHEMY), "API_KEY_ALCHEMY env var missing.");
// assert(hasKey(API_KEY_CHAINNODES), "API_KEY_CHAINNODES env var missing.");
// assert(hasKey(API_KEY_QUICKNODE), "API_KEY_QUICKNODE env var missing.");

// export const PROVIDER_URLS = [
//   `https://arb-mainnet.g.alchemy.com/v2/${API_KEY_ALCHEMY}`,
//   `https://arbitrum-one.chainnodes.org/${API_KEY_CHAINNODES}`,
//   `https://prettiest-few-darkness.arbitrum-mainnet.discover.quiknode.pro/${API_KEY_QUICKNODE}/`,
//   `https://1rpc.io/${API_KEY_1RPC}/arb`
// ];

// const getProvider = (url: string) => {
//   const network = Network.from(42161);
//   const options = { batchMaxSize: 20, pollingInterval: 8000, staticNetwork: network };
//   return new JsonRpcProvider(url, undefined, options);
// };

// const providers = [];
// if (NODE_ENV !== "production") {
//   const url = "http://localhost:8545";
//   const network = Network.from(1337);
//   const options = { batchMaxSize: 20, pollingInterval: 8000, staticNetwork: network };
//   const provider = new JsonRpcProvider(url, undefined, options);
//   providers.push({ provider, priority: 1, weight: 1 });
// } else {
//   PROVIDER_URLS.forEach((url, index) => {
//     const provider = getProvider(url);
//     providers.push({ provider, priority: index + 1, weight: 1 });
//   });
// }

// // const provider = new FallbackProvider(providers, undefined, { quorum: 1, pollingInterval: 30_000 });
// const [{ provider }] = providers;
// provider.on("error", logger.error);

// export default provider;
