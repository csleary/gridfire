import { execSync } from "child_process";

const { BENTO4_DIR } = process.env;

const createMPD = (mp4, trackId, outputDirectory) =>
  execSync(
    `${BENTO4_DIR}/mp4dash \
    -o ${outputDirectory} \
    --force \
    --mpd-name=${trackId}.mpd \
    --no-media \
    --no-split \
    --use-segment-list \
    --hls \
    --exec-dir=${BENTO4_DIR} \
    ${mp4}`
  );

export default createMPD;
