import { Interface, getBigInt, toQuantity } from "ethers";
import axios, { AxiosResponse } from "axios";
import { JSONRPCResponse } from "json-rpc-2.0";
import { EventEmitter } from "node:events";
import GridfireEditionsAbi from "gridfire-web3-events/controllers/web3/abi/editions/index.js";
import GridfirePaymentAbi from "gridfire-web3-events/controllers/web3/abi/payment/index.js";
import { LogDescription } from "ethers";
import assert from "node:assert/strict";
import filterErrors from "./filterErrors/index.js";
import logger from "gridfire-web3-events/controllers/logger.js";
import objectHash from "object-hash";

enum EventNames {
  EDITION_MINTED = "EditionMinted",
  PURCHASE_EDITION = "PurchaseEdition",
  PURCHASE = "Purchase"
}

type ProviderResult = { provider: symbol; data: JSONRPCResponse[]; error: any };
type Request = { method: string; params: any[] };
type RequestOptions = { timeout?: number };

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

const isRejected = <T>(p: PromiseSettledResult<T>): p is PromiseRejectedResult => p.status === "rejected";
const ALCHEMY = Symbol("alchemy");
const CHAINNODES = Symbol("chainnodes");
const LOCALHOST = Symbol("localhost");
const QUIKNODE = Symbol("quiknode");
const ONE_RPC = Symbol("1rpc");

const PROVIDERS: [name: symbol, url: string][] = [
  [ALCHEMY, `https://arb-mainnet.g.alchemy.com/v2/${API_KEY_ALCHEMY}`],
  [CHAINNODES, `https://arbitrum-one.chainnodes.org/${API_KEY_CHAINNODES}`],
  [QUIKNODE, `https://prettiest-few-darkness.arbitrum-mainnet.discover.quiknode.pro/${API_KEY_QUICKNODE}/`]
  // [ONE_RPC, `https://1rpc.io/${API_KEY_1RPC}/arb`]
];

class GridfireProvider extends EventEmitter {
  #currentBlockNumber: string = "";
  #id: bigint = 0n;
  #pollingInterval: number = 5000;
  #quorum: number = 1;
  #timeout: NodeJS.Timeout;
  #topics: Map<string, string[]> = new Map();
  #providers: Map<symbol, string> = new Map([[LOCALHOST, "http://localhost:8545"]]);

  constructor() {
    super();

    if (NODE_ENV === "production") {
      this.#providers.clear();
      PROVIDERS.forEach(([provider, url]) => this.#providers.set(provider, url));
    }

    this.#setTopics();
    this.#quorum = Math.ceil(this.#providers.size / 2);
    this.#timeout = setTimeout(() => {}, 0);
    this.#getLogs();
  }

  destroy() {
    super.removeAllListeners();
    clearTimeout(this.#timeout);
    logger.info("Listeners removed, timeout cleared. Ready for shutdown.");
  }

  #emitEvent(eventName: string, log: LogDescription, transactionHash: string): void {
    const { args } = log;
    this.emit(eventName, ...args, { getTransactionReceipt: this.#getTransactionReceipt.bind(this, transactionHash) });
  }

  #getAddressByEventName(eventName: string): string {
    switch (eventName) {
      case EventNames.EDITION_MINTED:
      case EventNames.PURCHASE_EDITION:
        return GRIDFIRE_EDITIONS_ADDRESS!;
      case EventNames.PURCHASE:
      default:
        return GRIDFIRE_PAYMENT_ADDRESS!;
    }
  }

  async #getBlockNumber(): Promise<string> {
    const method = "eth_blockNumber";
    const responses = await this.#send([{ method, params: [] }]);

    const highestBlock = responses
      .filter(filterErrors)
      .sort((a, b) => {
        const blockHeightA = getBigInt(a.data[0]?.result || 0n);
        const blockHeightB = getBigInt(b.data[0]?.result || 0n);
        if (blockHeightA < blockHeightB) return -1;
        if (blockHeightA > blockHeightB) return 1;
        return 0;
      })
      .pop();

    if (!highestBlock) {
      throw new Error("Could not get block height from any provider.");
    }

    const [{ result }] = highestBlock.data;
    return result;
  }

  #getId(): string {
    return (this.#id++).toString();
  }

  #getInterfaceByEventName(eventName: string): Interface {
    switch (eventName) {
      case EventNames.EDITION_MINTED:
      case EventNames.PURCHASE_EDITION:
        return new Interface(GridfireEditionsAbi);
      case EventNames.PURCHASE:
      default:
        return new Interface(GridfirePaymentAbi);
    }
  }

  async #getLogs(): Promise<void> {
    try {
      const blockNumber = await this.#getBlockNumber();

      if (blockNumber === this.#currentBlockNumber) {
        return;
      }

      let fromBlock = "0x0";
      if (!this.#currentBlockNumber) {
        fromBlock = blockNumber;
      } else {
        fromBlock = toQuantity(getBigInt(this.#currentBlockNumber) + 1n);
      }

      const batch = Array.from(this.#topics).map(([eventName, topics]) => {
        const address = this.#getAddressByEventName(eventName);
        return { method: "eth_getLogs", params: [{ fromBlock, toBlock: blockNumber, address, topics }] };
      });

      const responses = await this.#send(batch);
      const definitiveResult = this.#getQuorumValue(responses);

      definitiveResult.data.forEach(({ result: logs }: any, index: number) => {
        const eventName = Array.from(this.#topics.keys())[index];
        const iface = this.#getInterfaceByEventName(eventName);

        logs.forEach((log: any) => {
          const { transactionHash } = log;
          const description = iface.parseLog(log);
          this.#emitEvent(eventName, description!, transactionHash);
        });
      });

      this.#currentBlockNumber = blockNumber;
    } catch (error: any) {
      this.emit("error", "[#getFilterLogs]", error.response?.data || error);
    } finally {
      this.#timeout = setTimeout(this.#getLogs.bind(this), this.#pollingInterval);
    }
  }

  async #getTransactionReceipt(transactionHash: string): Promise<JSONRPCResponse> {
    const method = "eth_getTransactionReceipt";
    const responses = await this.#send([{ method, params: [transactionHash] }]);
    const definitiveResult = this.#getQuorumValue(responses);
    const [{ result }] = definitiveResult.data;
    return result;
  }

  #getQuorumValue(results: ProviderResult[]): ProviderResult {
    let definitiveResult: any = null;
    const total = new Map();
    const excludeKeys = (key: string) => key === "id";

    results.filter(filterErrors).forEach(result => {
      if (definitiveResult) return;
      const hash = objectHash(result.data, { excludeKeys });
      total.set(hash, (total.get(hash) ?? 0) + 1);

      if (total.get(hash) === this.#quorum) {
        definitiveResult = result;
      }
    });

    if (!definitiveResult) {
      throw new Error("Quorum not reached on result.");
    }

    return definitiveResult;
  }

  #normaliseProviderResults(results: PromiseSettledResult<AxiosResponse<JSONRPCResponse[], any>>[]): ProviderResult[] {
    const providers = Array.from(this.#providers);

    return results.map((result, index) => {
      const [provider] = providers[index];

      if (isRejected(result)) {
        return { data: [], error: result.reason, provider };
      }

      const { data } = result.value;
      return { data, error: null, provider };
    });
  }

  async #send(requests: Request[], { timeout = 5000 }: RequestOptions = {}): Promise<ProviderResult[]> {
    const providers = Array.from(this.#providers);
    const body = requests.map(({ method, params }) => ({ method, params, id: this.#getId(), jsonrpc: "2.0" }));
    const providerRequests = providers.map(([, url]) => axios.post(url, body, { timeout }));
    const promiseResults = await Promise.allSettled(providerRequests);
    const providerResults = this.#normaliseProviderResults(promiseResults);
    return providerResults;
  }

  #setTopics(): void {
    Object.values(EventNames).forEach(eventName => {
      const iface = this.#getInterfaceByEventName(eventName);
      const event = iface.getEvent(eventName);
      const topic = iface.encodeFilterTopics(event!, []) as string[];
      this.#topics.set(eventName, topic);
    });
  }
}

export default GridfireProvider;
