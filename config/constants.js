const nem = require('nem-sdk').default;
const path = require('path');

const AWS_REGION = 'us-east-1';
const BENTO4_DIR = process.env.BENTO4_DIR;
const BUCKET_MP3 = 'nemp3-mp3';
const QUEUE_ARTWORK = 'artwork';
const QUEUE_CREDITS = 'credits';
const QUEUE_TRANSCODE = 'transcode';
const TEMP_PATH = path.join(__dirname, '../tmp');

const PRODUCTS = [
  { sku: '01NPC', label: '1 Credit', quantity: 1, unitPrice: 15 },
  { sku: '05NPC', label: '5 Credits', quantity: 5, unitPrice: 12 },
  { sku: '10NPC', label: '10 Credits', quantity: 10, unitPrice: 10 }
];

let BUCKET_IMG = 'nemp3-img';
let BUCKET_OPT = 'nemp3-opt';
let BUCKET_SRC = 'nemp3-src';
let GOOGLE_CALLBACK = 'https://nemp3.app/api/auth/google/callback';
let GOOGLE_REDIRECT = 'https://nemp3.app/oauth/google';
let PAYMENT_ADDRESS = 'NC7KCRGLODPZM6F6E64W4AABKLLONP2XY7FNEMP3';
let SOCKET_HOST = 'https://nemp3.app';
let SPOTIFY_CALLBACK = 'https://nemp3.app/api/auth/spotify/callback';
let SPOTIFY_REDIRECT = 'https://nemp3.app/oauth/spotify';
let TWITTER_CALLBACK = 'https://nemp3.app/api/auth/twitter/callback';
let TWITTER_REDIRECT = 'https://nemp3.app/oauth/twitter';
let NEM_NETWORK_ID = nem.model.network.data.mainnet.id;
let NEM_NODES = ['176.9.68.110', '176.9.20.180', '199.217.118.114', '108.61.182.27', '108.61.168.86', '104.238.161.61'];
let RABBIT_HOST = 'rabbit';

if (process.env.NODE_ENV === 'development') {
  GOOGLE_CALLBACK = '/api/auth/google/callback';
  GOOGLE_REDIRECT = 'http://localhost:3000/oauth/google';
  PAYMENT_ADDRESS = 'TD74GONFLRQVX5Z75TTRQRD22A65K44E6VUH7QSZ';
  RABBIT_HOST = 'localhost';
  SOCKET_HOST = 'http://localhost:3000';
  SPOTIFY_CALLBACK = '/api/auth/spotify/callback';
  SPOTIFY_REDIRECT = 'http://localhost:3000/oauth/spotify';
  TWITTER_CALLBACK = '/api/auth/twitter/callback';
  TWITTER_REDIRECT = 'http://localhost:3000/oauth/twitter';
}

if (process.env.NEM_NETWORK === 'testnet') {
  BUCKET_IMG = 'nemp3-testnet-img';
  BUCKET_OPT = 'nemp3-testnet-opt';
  BUCKET_SRC = 'nemp3-testnet-src';
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
  PAYMENT_ADDRESS,
  PRODUCTS,
  QUEUE_ARTWORK,
  QUEUE_CREDITS,
  QUEUE_TRANSCODE,
  RABBIT_HOST,
  SOCKET_HOST,
  SPOTIFY_CALLBACK,
  SPOTIFY_REDIRECT,
  TEMP_PATH,
  TWITTER_CALLBACK,
  TWITTER_REDIRECT
};
