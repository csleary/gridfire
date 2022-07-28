import { execSync } from "child_process";
import path from "path";

const { TEMP_PATH } = process.env;

const packageMP4 = (inputPath, output) => {
  const command = `
packager-linux-x64 \
--generate_static_live_mpd \
--hls_master_playlist_output ${output}/master.m3u8 \
--mpd_output ${output}/dash.mpd \
--segment_duration 10 \
in='${inputPath},init_segment=${output}/init.mp4,segment_template=${output}/$Number$.m4s,playlist_name=${output}/audio.m3u8,stream=audio'`;

  execSync(command, { cwd: path.resolve(TEMP_PATH) });
};

export default packageMP4;
