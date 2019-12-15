const { execSync } = require('child_process');
const { BENTO4_DIR } = require('../config/constants');

const createMpd = (audioFile, trackId, outputPath) =>
  execSync(
    `${BENTO4_DIR}/mp4dash \
                --exec-dir=${BENTO4_DIR} \
                -f \
                --mpd-name=${trackId}.mpd \
                --no-media \
                --no-split \
                -o ${outputPath} \
                --use-segment-list \
                ${audioFile}`
  );

module.exports = {
  createMpd
};
