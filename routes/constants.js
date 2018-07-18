const AWS_REGION = 'us-east-1';
const BUCKET_IMG = 'nemp3-img';
const BUCKET_SRC =
  process.env.NEM_NETWORK === 'mainnet' ? 'nemp3-src' : 'nemp3-src-testnet';
const BUCKET_OPT =
  process.env.NEM_NETWORK === 'mainnet' ? 'nemp3-opt' : 'nemp3-opt-testnet';
const TRANSCODER_PIPELINE_ID =
  process.env.NEM_NETWORK === 'mainnet'
    ? '1513688795531-iszg5h'
    : '1531674273682-xv3ewm';

module.exports = {
  AWS_REGION,
  BUCKET_IMG,
  BUCKET_SRC,
  BUCKET_OPT,
  TRANSCODER_PIPELINE_ID
};
