const AWS_REGION = 'us-east-1';
const BENTO4_DIR = process.env.BENTO4_DIR;
const BUCKET_MP3 = 'nemp3-mp3';
const QUEUE_TRANSCODE = 'transcode';
const TEMP_PATH = process.env.TEMP_PATH;

let BUCKET_IMG = 'nemp3-img';
let BUCKET_OPT = 'nemp3-opt';
let BUCKET_SRC = 'nemp3-src';
let SOCKET_HOST = 'https://nemp3.app';
let RABBIT_HOST = 'rabbit';

if (process.env.NODE_ENV === 'development') {
  BUCKET_IMG = 'nemp3-testnet-img';
  BUCKET_OPT = 'nemp3-testnet-opt';
  BUCKET_SRC = 'nemp3-testnet-src';
  RABBIT_HOST = 'localhost';
  SOCKET_HOST = 'http://localhost:3000';
}

export {
  AWS_REGION,
  BENTO4_DIR,
  BUCKET_IMG,
  BUCKET_MP3,
  BUCKET_OPT,
  BUCKET_SRC,
  QUEUE_TRANSCODE,
  RABBIT_HOST,
  SOCKET_HOST,
  TEMP_PATH
};
