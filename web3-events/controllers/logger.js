const deploymentName = "[Web3 Events]";

export const logger = {
  error: console.error.bind(null, deploymentName),
  info: console.log.bind(null, deploymentName),
  warn: console.warn.bind(null, deploymentName)
};
