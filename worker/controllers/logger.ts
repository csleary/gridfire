const deploymentName = "[Worker]";

const logger = {
  error: console.error.bind(null, deploymentName),
  info: console.info.bind(null, deploymentName),
  log: console.log.bind(null, deploymentName),
  warn: console.warn.bind(null, deploymentName)
};

export default logger;
