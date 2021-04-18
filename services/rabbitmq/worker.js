const { publishToQueue } = require('./publisher');
const socketMessage = require('./socketMessage');

const handleWork = (io, workerPool, workerData, workerScript) =>
  new Promise((resolve, reject) => {
    const emit = socketMessage(io);

    workerPool.acquire(workerScript, { workerData }, (poolError, worker) => {
      if (poolError) reject(poolError.message);

      worker.on('message', async message => {
        const { queue, type } = message;

        if (type === 'publishToQueue') {
          publishToQueue('', queue, message);
        } else if (type) {
          emit(type, message);
        } else {
          emit('workerMessage', message);
        }
      });

      worker.on('error', workerError => {
        console.log('Worker error: %s', workerError.message);
        reject(workerError.message);
      });

      worker.on('exit', status => {
        if (status > 0) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  });

module.exports = handleWork;
