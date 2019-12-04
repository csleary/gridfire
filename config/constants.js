const nem = require('nem-sdk').default;
const path = require('path');

const AWS_REGION = 'us-east-1';
const BENTO4_DIR = process.env.BENTO4_DIR;
const BUCKET_IMG = 'nemp3-img';
const BUCKET_MP3 = 'nemp3-mp3';
const BUCKET_OPT =
  process.env.NEM_NETWORK === 'mainnet' ? 'nemp3-opt' : 'nemp3-opt-testnet';
const BUCKET_SRC =
  process.env.NEM_NETWORK === 'mainnet' ? 'nemp3-src' : 'nemp3-src-testnet';
const GOOGLE_CALLBACK =
  process.env.NODE_ENV === 'production' && process.env.NEM_NETWORK === 'mainnet'
    ? 'https://nemp3.app/api/auth/google/callback'
    : '/api/auth/google/callback';
const GOOGLE_REDIRECT =
  process.env.NODE_ENV === 'production' && process.env.NEM_NETWORK === 'mainnet'
    ? 'https://nemp3.app/oauth/google'
    : 'http://localhost:3000/oauth/google';
const NEM_NODE =
  process.env.NEM_NETWORK === 'mainnet'
    ? 'http://209.126.98.204'
    : nem.model.nodes.defaultTestnet;
const NEM_NETWORK_ID =
  process.env.NEM_NETWORK === 'mainnet'
    ? nem.model.network.data.mainnet.id
    : nem.model.network.data.testnet.id;
const TEMP_PATH = path.join(__dirname, '/../tmp/');

module.exports = {
  AWS_REGION,
  BENTO4_DIR,
  BUCKET_IMG,
  BUCKET_MP3,
  BUCKET_OPT,
  BUCKET_SRC,
  GOOGLE_CALLBACK,
  GOOGLE_REDIRECT,
  NEM_NODE,
  NEM_NETWORK_ID,
  TEMP_PATH
};
