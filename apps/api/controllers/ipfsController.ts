import { create } from "ipfs-http-client";

const { IPFS_NODE_HOST } = process.env;
const ipfs = create(IPFS_NODE_HOST);

export default ipfs;
