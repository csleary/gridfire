const nem = require('nem-sdk').default;

const AWS_REGION = 'us-east-1';
const BENTO4_DIR = process.env.BENTO4_DIR;
const BUCKET_IMG = 'nemp3-img';
const BUCKET_MP3 = 'nemp3-mp3';
const BUCKET_OPT =
  process.env.NEM_NETWORK === 'mainnet' ? 'nemp3-opt' : 'nemp3-opt-testnet';
const BUCKET_SRC =
  process.env.NEM_NETWORK === 'mainnet' ? 'nemp3-src' : 'nemp3-src-testnet';
const NEM_NODE =
  process.env.NEM_NETWORK === 'mainnet'
    ? 'http://209.126.98.204'
    : nem.model.nodes.defaultTestnet;

module.exports = {
  AWS_REGION,
  BENTO4_DIR,
  BUCKET_IMG,
  BUCKET_MP3,
  BUCKET_OPT,
  BUCKET_SRC,
  NEM_NODE
};
