import { execSync } from "child_process";

const { BENTO4_DIR } = process.env;

const createMPD = (audioFile, trackId, outputPath) =>
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

export default createMPD;
