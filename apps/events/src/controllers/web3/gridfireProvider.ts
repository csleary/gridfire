import filterErrors from "@gridfire/events/controllers/web3/filterErrors";
import Logger from "@gridfire/shared/logger";
import type { Contract, Provider, ProviderRequest, ProviderResult, RequestOptions } from "@gridfire/shared/types";
import axios, { AxiosResponse } from "axios";
import { EventLog, Interface, LogDescription, getBigInt, toQuantity } from "ethers";
import { JSONRPCResponse } from "json-rpc-2.0";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import objectHash from "object-hash";

const logger = new Logger("GridfireProvider");
const isRejected = <T>(p: PromiseSettledResult<T>): p is PromiseRejectedResult => p.status === "rejected";

interface GridfireProviderConfig {
  providers: Provider[];
  contracts: Contract[];
}

class GridfireProvider extends EventEmitter {
  #contracts: Contract[] = [];
  #currentBlockNumber: string = "";
  #id: bigint = 0n;
  #pollingInterval: number = 10_000;
  #quorum: number = 1;
  #timeout: NodeJS.Timeout;
  #providers: Map<symbol, string> = new Map([]);

  constructor({ providers, contracts }: GridfireProviderConfig) {
    super();
    assert(providers.length > 0, "No providers provided.");
    assert(contracts.length > 0, "No contracts provided.");
    providers.forEach(([provider, url]) => this.#providers.set(provider, url));
    contracts.forEach(contract => this.#contracts.push(contract));
    this.#quorum = Math.ceil(this.#providers.size / 2);
    this.#timeout = setTimeout(() => {}, 0);
    this.#getLogs();
  }

  destroy() {
    super.removeAllListeners();
    clearTimeout(this.#timeout);
    logger.info("Listeners removed, timeout cleared. Ready for shutdown.");
  }

  #emitEvent(eventName: string, logDescription: LogDescription, log: EventLog): void {
    const { args } = logDescription;

    this.emit(eventName, ...args, {
      ...log,
      getTransactionReceipt: this.#getTransactionReceipt.bind(this, log.transactionHash)
    });
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

  async #getLogs(): Promise<void> {
    try {
      const blockNumber = await this.#getBlockNumber();

      if (blockNumber === this.#currentBlockNumber) {
        return;
      }

      let fromBlock = "";
      if (!this.#currentBlockNumber) {
        fromBlock = blockNumber;
      } else {
        fromBlock = toQuantity(getBigInt(this.#currentBlockNumber) + 1n);
      }

      const config = this.#contracts.flatMap(contract => {
        const { abi, address, events } = contract;
        const iface = new Interface(abi);

        return events.flatMap(([eventName, eventFilters = []]) => {
          const event = iface.getEvent(eventName);
          const topics = iface.encodeFilterTopics(event!, eventFilters);
          const params = [{ fromBlock, toBlock: blockNumber, address, topics }];
          const request = { method: "eth_getLogs", params };
          return { eventName, iface, request };
        });
      });

      const batch = config.map(({ request }) => request);
      const responses = await this.#send(batch);
      const definitiveResult = this.#getQuorumValue(responses);

      definitiveResult.data.forEach(({ result }: any, index: number) => {
        const { eventName, iface } = config[index];

        result.forEach((log: EventLog) => {
          const description = iface.parseLog(log);
          this.#emitEvent(eventName, description!, log);
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
    const filtered = results.filter(filterErrors);
    const tooFewResults = filtered.length < this.#quorum;
    let definitiveResult: ProviderResult | null = null;
    const total = new Map();
    const excludeKeys = (key: string) => key === "id";

    filtered.forEach(result => {
      if (definitiveResult) return;
      const hash = objectHash(result.data, { excludeKeys });
      total.set(hash, (total.get(hash) ?? 0) + 1);

      if (tooFewResults || total.get(hash) === this.#quorum) {
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

  async #send(requests: ProviderRequest[], { timeout = 5_000 }: RequestOptions = {}): Promise<ProviderResult[]> {
    const providers = Array.from(this.#providers);
    const body = requests.map(({ method, params }) => ({ method, params, id: this.#getId(), jsonrpc: "2.0" }));
    const providerRequests = providers.map(([, url]) => axios.post(url, body, { timeout }));
    const promiseResults = await Promise.allSettled(providerRequests);
    const providerResults = this.#normaliseProviderResults(promiseResults);
    return providerResults;
  }
}

export default GridfireProvider;
