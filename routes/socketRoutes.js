const { QUEUE_TRANSCODE } = require('../config/constants');
const { publishToQueue } = require('../services/rabbitMQ/publisher');

module.exports = app => {
  const io = app.get('socketio');

  // Transcode Audio
  io.on('connection', socket => {
    socket.on('transcode', payload => {
      const { releaseId, trackId, trackName } = payload;
      publishToQueue('', QUEUE_TRANSCODE, {
        clientId: socket.id,
        releaseId,
        trackId,
        trackName,
        job: 'transcodeAAC'
      });
    });
  });
};
