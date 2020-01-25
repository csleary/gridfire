const handleWork = (io, workerData, workerPool) =>
  new Promise((resolve, reject) => {
    const ioEmit = require('./ioEmit')(io);

    workerPool.acquire(
      workerData.script,
      { workerData },
      (poolError, worker) => {
        if (poolError) {
          reject(poolError.message);
        }

        worker.on('message', message =>
          ioEmit('workerMessage', { message, ...workerData })
        );
        worker.on('error', workerError => reject(workerError.message));
        worker.on('exit', status => {
          if (status > 0) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      }
    );
  });

module.exports = handleWork;
