const sendEvent = (res, { type, ...message } = {}) => {
  if (!res) return;
  const data = JSON.stringify(message);

  if (type) {
    res.write(`event: ${type}\n`);
    res.write(`data: ${data}\n\n`);
  } else {
    res.write("event: workerMessage\n");
    res.write(`data: ${data}\n\n`);
  }
};

export { sendEvent };
