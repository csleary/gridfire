const { execSync } = require('child_process');
const { BENTO4_DIR } = require('../config/constants');

const createMpd = (audioFile, trackId, outputPath) =>
  execSync(
    `${BENTO4_DIR}/mp4dash \
    -o ${outputPath} \
    --force \
    --mpd-name=${trackId}.mpd \
    --no-media \
    --no-split \
    --use-segment-list \
    --hls \
    --exec-dir=${BENTO4_DIR} \
    ${audioFile}`
  );

module.exports = { createMpd };
