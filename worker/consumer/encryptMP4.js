import { execSync } from "child_process";

const { BENTO4_DIR } = process.env;

const encryptMP4 = ({ key, kid, mp4Path, mp4PathEnc }) =>
  execSync(
    `${BENTO4_DIR}/mp4encrypt \
  --method MPEG-CENC \
  --key 1:${key}:random \
  --property 1:KID:${kid} \
  --global-option mpeg-cenc.eme-pssh:true \
  --strict \
  ${mp4Path} \
  ${mp4PathEnc}`
  );

export default encryptMP4;
