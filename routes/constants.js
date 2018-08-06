const AWS_REGION = 'us-east-1';
const BUCKET_IMG = 'nemp3-img';
const BUCKET_SRC =
  process.env.NEM_NETWORK === 'mainnet' ? 'nemp3-src' : 'nemp3-src-testnet';
const BUCKET_OPT =
  process.env.NEM_NETWORK === 'mainnet' ? 'nemp3-opt' : 'nemp3-opt-testnet';

module.exports = {
  AWS_REGION,
  BUCKET_IMG,
  BUCKET_SRC,
  BUCKET_OPT
};
