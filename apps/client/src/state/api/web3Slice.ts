import { apiSlice } from "./apiSlice";

interface BlockRangeDocument {
  createdAt: string;
  lastQueuedBlock: number;
  lastQueuedBlockHex: string;
  updatedAt: string;
}

interface GridfireLog {
  blockNumber: number;
  logIndex: string;
  transactionHash: string;
  value: string;
}

interface GridfirePaymentLog {
  artistId: string;
  artistName: string;
  blockNumber: number;
  editionId?: string;
  logIndex: string;
  paid: string;
  releaseId: string;
  releaseTitle: string;
  transactionHash: string;
}

const web3Slice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getApprovals: builder.query<GridfireLog[], string>({
      query: account => `/web3/approvals/${account}`
    }),
    getBlockRange: builder.query<BlockRangeDocument, void>({
      query: () => "/web3/block-range"
    }),
    getClaims: builder.query<GridfireLog[], void>({
      query: () => "/web3/claims"
    }),
    getPurchases: builder.query<GridfirePaymentLog[], string>({
      query: account => `/web3/purchases/${account}`
    })
  })
});

export const {
  endpoints,
  useGetApprovalsQuery,
  useGetBlockRangeQuery,
  useGetClaimsQuery,
  useGetPurchasesQuery,
  useLazyGetApprovalsQuery,
  useLazyGetClaimsQuery,
  useLazyGetPurchasesQuery
} = web3Slice;
