import filterErrors from "@gridfire/events/controllers/web3/filterErrors";
import Logger from "@gridfire/shared/logger";
import type { Contract, Provider, ProviderRequest, ProviderResult, RequestOptions } from "@gridfire/shared/types";
import axios, { AxiosResponse } from "axios";
import { EventLog, Interface, LogDescription, getBigInt, toQuantity } from "ethers";
import { JSONRPCResponse } from "json-rpc-2.0";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import objectHash from "object-hash";

const isRejected = <T>(p: PromiseSettledResult<T>): p is PromiseRejectedResult => p.status === "rejected";

interface GridfireProviderConfig {
  contracts: Contract[];
  name?: string;
  pollingInterval?: number;
  providers: Provider[];
  quorum?: number;
}

class GridfireProvider extends EventEmitter {
  #contracts: Contract[] = [];
  #id: bigint = 0n;
  #lastCheckedBlockNumber: string = "";
  #logger;
  #name = "gridfireProvider";
  #pollingInterval: number = 10_000;
  #providers: Map<symbol, string> = new Map([]);
  #quorum: number = 1;
  #timeout: NodeJS.Timeout;

  constructor({ contracts, name, pollingInterval, providers, quorum }: GridfireProviderConfig) {
    super();
    assert(providers.length > 0, "No providers provided.");
    assert(contracts.length > 0, "No contracts provided.");
    contracts.forEach(contract => this.#contracts.push(contract));
    this.#name = name || this.#name;
    this.#logger = new Logger(this.#name);
    this.#pollingInterval = pollingInterval || this.#pollingInterval;
    this.#logger.info("Polling interval set to", this.#pollingInterval, "ms.");
    providers.forEach(([provider, url]) => this.#providers.set(provider, url));
    this.#logger.info("Using", this.#providers.size, "provider(s).");
    this.#quorum = quorum || Math.ceil(this.#providers.size / 2);
    this.#logger.info("Quorum set to", this.#quorum);

    assert(
      this.#providers.size >= this.#quorum,
      `Not enough providers (${this.#providers.size}) for the specified quorum (${this.#quorum}).`
    );

    this.#timeout = setTimeout(() => {}, 0);
    this.#getLogs();
    this.on("error", (...errors) => this.#logger.error(...errors));
  }

  destroy() {
    super.removeAllListeners();
    clearTimeout(this.#timeout);
    this.#logger.info("Listeners removed, timeout cleared. Ready for shutdown.");
  }

  #emitEvent(eventName: string, logDescription: LogDescription, log: EventLog): void {
    const { args } = logDescription;
    const getTransactionReceipt = this.#getTransactionReceipt.bind(this, log.transactionHash);
    this.emit(eventName, ...args, { ...log, getTransactionReceipt });
  }

  async #getBlockNumber(): Promise<string> {
    const method = "eth_blockNumber";
    const definitiveResult = await this.#sendUntilQuorumReached([{ method, params: [] }]);
    const [{ result }] = definitiveResult.data;
    this.#logger.debug("Current block number:", result);
    return result;
  }

  #getId(): string {
    return (this.#id++).toString();
  }

  async #getLogs(): Promise<void> {
    try {
      const blockNumber = await this.#getBlockNumber();

      if (blockNumber === this.#lastCheckedBlockNumber) {
        this.#logger.debug("No new blocks found, skipping log retrieval.");
        return;
      }

      let fromBlock = "";
      if (!this.#lastCheckedBlockNumber) {
        fromBlock = blockNumber;
      } else {
        fromBlock = toQuantity(getBigInt(this.#lastCheckedBlockNumber) + 1n);
      }

      this.#logger.debug("Retrieving logs in block range:", fromBlock, "to", blockNumber);

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
      const definitiveResult = await this.#sendUntilQuorumReached(batch);

      definitiveResult.data.forEach(({ result }: any, index: number) => {
        const { eventName, iface } = config[index];

        result.forEach((log: EventLog) => {
          const description = iface.parseLog(log);
          this.#emitEvent(eventName, description!, log);
        });
      });

      this.#lastCheckedBlockNumber = blockNumber;
    } catch (error: any) {
      this.emit("error", "[#getFilterLogs]", error.response?.data || error);
    } finally {
      this.#timeout = setTimeout(this.#getLogs.bind(this), this.#pollingInterval);
    }
  }

  async #getTransactionReceipt(transactionHash: string): Promise<JSONRPCResponse> {
    const method = "eth_getTransactionReceipt";
    const definitiveResult = await this.#sendUntilQuorumReached([{ method, params: [transactionHash] }]);
    const [{ result }] = definitiveResult.data;
    return result;
  }

  #getQuorumResult(results: ProviderResult[]): ProviderResult | null {
    const excludeKeys = (key: string) => key === "id";
    const filtered = results.filter(filterErrors);
    const votes = new Map();
    let definitiveResult: ProviderResult | null = null;

    filtered.forEach(result => {
      if (definitiveResult) return;
      const hash = objectHash(result.data, { excludeKeys });
      votes.set(hash, (votes.get(hash) ?? 0) + 1);

      if (votes.get(hash) === this.#quorum) {
        definitiveResult = result;
      }
    });

    return definitiveResult;
  }

  #normaliseProviderResults(
    providers: [symbol, string][],
    results: PromiseSettledResult<AxiosResponse<JSONRPCResponse[], any>>[]
  ): ProviderResult[] {
    return results.map((result, index) => {
      const [provider] = providers[index];

      if (isRejected(result)) {
        return { data: [], error: result.reason, provider };
      }

      const { data } = result.value;
      return { data, error: null, provider };
    });
  }

  // Previous fan-out method.
  async #send(requests: ProviderRequest[], { timeout = 5_000 }: RequestOptions = {}): Promise<ProviderResult[]> {
    const providers = Array.from(this.#providers);
    const body = requests.map(({ method, params }) => ({ method, params, id: this.#getId(), jsonrpc: "2.0" }));
    const providerRequests = providers.map(([, url]) => axios.post(url, body, { timeout }));
    const promiseResults = await Promise.allSettled(providerRequests);
    const providerResults = this.#normaliseProviderResults(providers, promiseResults);
    return providerResults;
  }

  #shuffle = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
  };

  // Batched randomly in quorum-sized chunks to avoid hitting same provider too often.
  async #sendUntilQuorumReached(
    requests: ProviderRequest[],
    { timeout = 5000 }: RequestOptions = {}
  ): Promise<ProviderResult> {
    const providers = this.#shuffle(Array.from(this.#providers));
    const results: ProviderResult[] = [];
    const body = requests.map(({ method, params }) => ({ method, params, id: this.#getId(), jsonrpc: "2.0" }));
    let definitiveResult: ProviderResult | null = null;

    const batches = providers.reduce<[symbol, string][][]>((total, _, i, array) => {
      if (i % this.#quorum === 0) {
        return [...total, array.slice(i, i + this.#quorum)];
      }
      return total;
    }, []);

    for (const batch of batches) {
      const providerRequests = batch.map(([, url]) => axios.post(url, body, { timeout }));
      const promiseResults = await Promise.allSettled(providerRequests);
      results.push(...this.#normaliseProviderResults(providers, promiseResults));
      const result = this.#getQuorumResult(results);

      if (result !== null) {
        definitiveResult = result;
        break;
      }
    }

    if (!definitiveResult) {
      throw new Error(`Quorum (${this.#quorum}) not reached on result.`);
    }

    return definitiveResult;
  }
}

export default GridfireProvider;
