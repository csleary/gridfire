import { execSync } from 'child_process';
import { BENTO4_DIR } from '../config/constants.js';

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

export { createMpd };
