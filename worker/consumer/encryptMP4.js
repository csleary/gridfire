import { randomBytes } from "crypto";
import { execSync } from "child_process";
import path from "path";

const { BIN_DIR, IPFS_GATEWAY_URL, TEMP_PATH } = process.env;

const encryptMP4 = (inputPath, output) => {
  const key = randomBytes(16).toString("hex");
  const kid = randomBytes(16).toString("hex");

  const command = `
${BIN_DIR}/shaka-packager \
-base_urls ${IPFS_GATEWAY_URL} \
-clear_lead 0 \
-enable_raw_key_decryption \
-enable_raw_key_encryption \
-hls_base_url ${IPFS_GATEWAY_URL} \
-hls_master_playlist_output master.m3u8 \
-keys label=AUDIO:key_id=${kid}:key=${key} \
-mpd_output dash.mpd \
-protection_scheme cenc \
-segment_duration 10 \
in=${inputPath},stream=audio,output=${output},output_format=mp4,playlist_name=hls.m3u8
`;

  execSync(command, { cwd: path.resolve(TEMP_PATH) });
  return { key, kid };
};
export default encryptMP4;
