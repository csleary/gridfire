const mongoose = require('mongoose');
require('../../models/Release');
const Release = mongoose.model('releases');
const { publishToQueue } = require('./publisher');

const handleWork = (io, workerPool, workerData, workerScript) =>
  new Promise((resolve, reject) => {
    const ioEmit = require('./ioEmit')(io);

    workerPool.acquire(workerScript, { workerData }, (poolError, worker) => {
      if (poolError) reject(poolError.message);

      worker.on('message', async message => {
        const { queue, type } = message;

        if (type === 'updateActiveRelease') {
          const release = await Release.findById(message.releaseId, '-__v', { lean: true });
          ioEmit('updateActiveRelease', { userId: release.user.toString(), release });
        } else if (type === 'publishToQueue') {
          publishToQueue('', queue, message);
        } else if (type) {
          ioEmit(type, message);
        } else {
          ioEmit('workerMessage', message);
        }
      });

      worker.on('error', workerError => reject(workerError.message));
      worker.on('stdout', output => {});

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
