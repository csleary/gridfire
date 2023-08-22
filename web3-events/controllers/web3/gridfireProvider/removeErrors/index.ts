import { JSONRPCResponse } from "json-rpc-2.0";
import logger from "gridfire-web3-events/controllers/logger.js";
import { isAxiosError } from "axios";

type ProviderResult = { provider: symbol; data: JSONRPCResponse[]; error: any };

const removeErrors = (result: ProviderResult): boolean => {
  const { data, error, provider } = result;
  const { description: providerName } = provider;

  if (isAxiosError(error)) {
    logger.warn(`[${providerName}] Request error:`, error.response?.data || error.message);
    return false;
  }

  if (error) {
    logger.warn(`[${providerName}] Provider request error: ${error.message}`);
    return false;
  }

  if (data.some(result => result.error)) {
    logger.warn(`[${providerName}] JSON-RPC response error:`);
    return false;
  }

  return true;
};

export default removeErrors;
