const nem = require('nem-sdk').default;
const path = require('path');

const AWS_REGION = 'us-east-1';
const BENTO4_DIR = process.env.BENTO4_DIR;
const BUCKET_IMG = 'nemp3-img';
const BUCKET_MP3 = 'nemp3-mp3';
const TEMP_PATH = path.join(__dirname, './../tmp/');

let BUCKET_OPT = 'nemp3-opt';
let BUCKET_SRC = 'nemp3-src';
let GOOGLE_CALLBACK = 'https://nemp3.app/api/auth/google/callback';
let GOOGLE_REDIRECT = 'https://nemp3.app/oauth/google';
let NEM_NETWORK_ID = nem.model.network.data.mainnet.id;
let NEM_NODE = 'http://209.126.98.204';

if (process.env.NODE_ENV === 'development') {
  GOOGLE_CALLBACK = '/api/auth/google/callback';
  GOOGLE_REDIRECT = 'http://localhost:3000/oauth/google';
}

if (process.env.NEM_NETWORK === 'testnet') {
  BUCKET_OPT = 'nemp3-opt-testnet';
  BUCKET_SRC = 'nemp3-src-testnet';
  NEM_NETWORK_ID = nem.model.network.data.testnet.id;
  NEM_NODE = nem.model.nodes.defaultTestnet;
}

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
