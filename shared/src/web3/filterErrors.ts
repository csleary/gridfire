import Logger from "@gridfire/shared/logger";
import { isAxiosError } from "axios";
import { JSONRPCResponse } from "json-rpc-2.0";

type ProviderResult = { provider: symbol; data: JSONRPCResponse | JSONRPCResponse[]; error: any };
const logger = new Logger("filterErrors");
const isBatchResponse = (data: JSONRPCResponse | JSONRPCResponse[]): data is JSONRPCResponse[] => Array.isArray(data);

const filterErrors = (result: ProviderResult): boolean => {
  const { data, error, provider } = result;
  const { description: providerName } = provider;

  if (isAxiosError(error)) {
    logger.error(`[${providerName}] Request error:`, error.response?.data || error.message);
    return false;
  }

  if (error) {
    logger.error(`[${providerName}] Provider request error: ${error.message}`);
    return false;
  }

  if (isBatchResponse(data) && data.some(d => d.error)) {
    data.forEach(result => logger.error(`[${providerName}] JSON-RPC response error:`, result.error));
    return false;
  }

  if (!isBatchResponse(data) && data.error) {
    logger.error(`[${providerName}] JSON-RPC response error:`, data.error);
    return false;
  }

  return true;
};

export default filterErrors;
