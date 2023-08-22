import { JSONRPCResponse } from "json-rpc-2.0";
import logger from "gridfire-web3-events/controllers/logger.js";

type ProviderResult = { provider: symbol; data: JSONRPCResponse[]; error: any };

const removeErrors = (result: ProviderResult): boolean => {
  const { data, error, provider } = result;

  if (error || data.some(result => result.error)) {
    logger.warn("JSON-RPC response error:", JSON.stringify({ data, error, provider: provider.description }, null, 2));
    return false;
  }

  return true;
};

export default removeErrors;
