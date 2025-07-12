import Logger from "@gridfire/shared/logger";
import type {
  GridfireContract,
  ProviderRequest,
  ProviderResponse,
  Providers,
  RequestOptions
} from "@gridfire/shared/types";
import filterErrors from "@gridfire/shared/web3/filterErrors";
import axios, { AxiosResponse } from "axios";
import { Interface, Log, LogDescription, getBigInt } from "ethers";
import { JSONRPCResponse, JSONRPCSuccessResponse } from "json-rpc-2.0";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { EventEmitter } from "node:events";

const isRejected = <T>(p: PromiseSettledResult<T>): p is PromiseRejectedResult => p.status === "rejected";
const isSuccessResponse = (resp: JSONRPCResponse): resp is JSONRPCSuccessResponse => "result" in resp;

interface GridfireProviderConfig {
  contracts?: GridfireContract[];
  name?: string;
  providers: Providers;
  quorum?: number;
}

interface GetLogsOptions {
  fromBlock: string;
  toBlock: string;
}

class GridfireProvider extends EventEmitter {
  #contracts: GridfireContract[] = [];
  #id: bigint = 0n;
  #logger;
  #name = "gridfire provider";
  #providers: Map<symbol, string> = new Map([]);
  #quorum: number = 1;

  constructor({ contracts = [], name, providers, quorum }: GridfireProviderConfig) {
    super();
    assert(providers.size > 0, "No providers provided.");
    contracts.forEach(contract => this.#contracts.push(contract));
    this.#logger = new Logger(this.#name);
    this.#name = name || this.#name;
    this.#providers = providers;
    this.#logger.info("Using", this.#providers.size, "provider(s).");
    this.#quorum = quorum || Math.ceil(this.#providers.size / 2);
    this.#logger.info("Quorum set to", this.#quorum);
    this.on("error", (...errors) => this.#logger.error(...errors));

    assert(
      this.#providers.size >= this.#quorum,
      `Not enough providers (${this.#providers.size}) for the specified quorum (${this.#quorum}).`
    );
  }

  destroy() {
    super.removeAllListeners();
    this.#logger.info("Listeners removed, timeout cleared. Ready for shutdown.");
  }

  async getBlockNumber({ finalised } = { finalised: false }): Promise<number> {
    if (finalised) {
      this.#logger.debug("Fetching latest finalised block…");
      const currentBlockHex = await this.#getFinalisedBlockNumber();
      return Number.parseInt(currentBlockHex, 16);
    }

    this.#logger.debug("Fetching latest block…");
    const currentBlockHex = await this.#getBlockNumber();
    return Number.parseInt(currentBlockHex, 16);
  }

  #emitEvent(eventName: string, logDescription: LogDescription, log: Log): void {
    const { args } = logDescription;
    const getTransactionReceipt = this.#getTransactionReceipt.bind(this, log.transactionHash);
    this.emit(eventName, ...args, { ...log, getTransactionReceipt });
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

  async #getFinalisedBlockNumber(): Promise<string> {
    const method = "eth_getBlockByNumber";
    const responses = await this.#send([{ method, params: ["finalized", false] }]); // transaction_detail_flag bool

    const highestBlock = responses
      .filter(filterErrors)
      .sort((a, b) => {
        const blockHeightA = getBigInt(a.data[0]?.result.number || 0n);
        const blockHeightB = getBigInt(b.data[0]?.result.number || 0n);
        if (blockHeightA < blockHeightB) return -1;
        if (blockHeightA > blockHeightB) return 1;
        return 0;
      })
      .pop();

    if (!highestBlock) {
      throw new Error("Could not get block height from any provider.");
    }

    const [{ result }] = highestBlock.data;
    return result.number;
  }

  #getId(): string {
    return (this.#id++).toString();
  }

  async getLogs({ fromBlock, toBlock }: GetLogsOptions): Promise<void> {
    try {
      this.#logger.debug("Retrieving logs in block range:", fromBlock, "to", toBlock);

      const config = this.#contracts.flatMap(contract => {
        const { abi, address, events } = contract;
        const iface = new Interface(abi);

        return Array.from(events.entries()).flatMap(([eventName, eventFilters]) => {
          const event = iface.getEvent(eventName);
          const topics = iface.encodeFilterTopics(event!, eventFilters);
          const params = [{ fromBlock, toBlock, address, topics }];
          const request = { method: "eth_getLogs", params };
          return { eventName, iface, request };
        });
      });

      const batch = config.map(({ request }) => request);
      const definitiveResponse = await this.#sendUntilQuorumReached(batch);

      definitiveResponse.data.forEach(({ result }: any, index: number) => {
        const { eventName, iface } = config[index];

        result.forEach((log: Log) => {
          const description = iface.parseLog(log);
          this.#emitEvent(eventName, description!, log);
        });
      });
    } catch (error: any) {
      this.emit("error", "[#getFilterLogs]", error.response?.data || error);
    }
  }

  async #getTransactionReceipt(transactionHash: string): Promise<JSONRPCResponse> {
    const method = "eth_getTransactionReceipt";
    const definitiveResponse = await this.#sendUntilQuorumReached([{ method, params: [transactionHash] }]);
    const [{ result }] = definitiveResponse.data;
    return result;
  }

  #getQuorumResult(
    responses: ProviderResponse[],
    { quorum = this.#quorum }: { quorum: number }
  ): ProviderResponse | null {
    const successfulResponses = responses.filter(filterErrors);
    const votes = new Map();
    let definitiveResponse: ProviderResponse | null = null;

    successfulResponses.forEach(response => {
      if (definitiveResponse) return;

      const normalised = response.data
        .filter(({ result }) => result.length > 0)
        .filter(isSuccessResponse)
        .sort((a, b) => Number(a.id ?? 0) - Number(b.id ?? 0))
        .flatMap(({ result }: { result: (Log & { logIndex: string })[] }) =>
          result
            .sort((a, b) => Number.parseInt(a.logIndex, 16) - Number.parseInt(b.logIndex, 16))
            .map(
              ({ blockNumber, address, logIndex, transactionHash }) =>
                `${blockNumber}-${address}-${transactionHash}-${logIndex}`
            )
        )
        .join(".");

      const hash = crypto.createHash("sha256").update(normalised).digest("hex");
      votes.set(hash, (votes.get(hash) ?? 0) + 1);

      if (votes.get(hash) === quorum) {
        definitiveResponse = response;
      }
    });

    return definitiveResponse;
  }

  #normaliseProviderResults(
    providers: [symbol, string][],
    results: PromiseSettledResult<AxiosResponse<JSONRPCResponse[], any>>[]
  ): ProviderResponse[] {
    return results.map((result, index) => {
      const [provider] = providers[index];

      if (isRejected(result)) {
        return { data: [], error: result.reason, provider };
      }

      const { data } = result.value;
      return { data, error: null, provider };
    });
  }

  async #send(requests: ProviderRequest[], { timeout = 5_000 }: RequestOptions = {}): Promise<ProviderResponse[]> {
    const providers = this.#shuffle(Array.from(this.#providers)).slice(0, this.#quorum);
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
    { quorum = this.#quorum, timeout = 5000 }: RequestOptions = {}
  ): Promise<ProviderResponse> {
    const providers = this.#shuffle(Array.from(this.#providers)).slice(0, quorum);
    const results: ProviderResponse[] = [];
    const body = requests.map(({ method, params }) => ({ method, params, id: this.#getId(), jsonrpc: "2.0" }));
    let definitiveResponse: ProviderResponse | null = null;

    const batches = providers.reduce<[symbol, string][][]>((total, _, i, array) => {
      if (i % quorum === 0) {
        return [...total, array.slice(i, i + quorum)];
      }
      return total;
    }, []);

    for (const batch of batches) {
      const providerNames = batch.map(([provider]) => provider.description).join(", ");
      this.#logger.info(`Sending request to providers (${providerNames})…`);
      const providerRequests = batch.map(([, url]) => axios.post(url, body, { timeout }));
      const promiseResults = await Promise.allSettled(providerRequests);
      const batchResults = this.#normaliseProviderResults(batch, promiseResults);
      results.push(...batchResults);
      const response = this.#getQuorumResult(results, { quorum });

      if (response !== null) {
        definitiveResponse = response;
        break;
      }

      this.#logger.info("Received:", JSON.stringify(batchResults, null, 2));
      this.#logger.info("Quorum not reached; continuing to next batch…");
    }

    if (!definitiveResponse) {
      throw new Error(`Quorum (${quorum}) not reached on result.`);
    }

    return definitiveResponse;
  }
}

export default GridfireProvider;
