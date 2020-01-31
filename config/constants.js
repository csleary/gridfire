const nem = require('nem-sdk').default;
const path = require('path');

const AWS_REGION = 'us-east-1';
const BENTO4_DIR = process.env.BENTO4_DIR;
const BUCKET_IMG = 'nemp3-img';
const BUCKET_MP3 = 'nemp3-mp3';
const QUEUE_TRANSCODE = 'transcode';
const QUEUE_ARTWORK = 'artwork';
const TEMP_PATH = path.join(__dirname, '../tmp');

let BUCKET_OPT = 'nemp3-opt';
let BUCKET_SRC = 'nemp3-src';
let GOOGLE_CALLBACK = 'https://nemp3.app/api/auth/google/callback';
let GOOGLE_REDIRECT = 'https://nemp3.app/oauth/google';
let NEM_NETWORK_ID = nem.model.network.data.mainnet.id;
let NEM_NODES = [
  '176.9.68.110',
  '176.9.20.180',
  '199.217.118.114',
  '108.61.182.27',
  '108.61.168.86',
  '104.238.161.61',
  '148.251.0.114',
  '209.126.98.204'
];
let RABBIT_HOST = 'rabbit';

if (process.env.NODE_ENV === 'development') {
  GOOGLE_CALLBACK = '/api/auth/google/callback';
  GOOGLE_REDIRECT = 'http://localhost:3000/oauth/google';
  RABBIT_HOST = 'localhost';
}

if (process.env.NEM_NETWORK === 'testnet') {
  BUCKET_OPT = 'nemp3-opt-testnet';
  BUCKET_SRC = 'nemp3-src-testnet';
  NEM_NETWORK_ID = nem.model.network.data.testnet.id;
  NEM_NODES = ['95.216.73.245', '95.216.73.243', '23.228.67.85'];
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
  NEM_NODES,
  NEM_NETWORK_ID,
  QUEUE_ARTWORK,
  QUEUE_TRANSCODE,
  RABBIT_HOST,
  TEMP_PATH
};
