import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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

export const logsApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "/api/web3" }),
  endpoints: builder => ({
    getApprovals: builder.query<GridfireLog[], string>({
      query: account => `/approvals/${account}`
    }),
    getClaims: builder.query<GridfireLog[], void>({
      query: () => "/claims"
    }),
    getPurchases: builder.query<GridfirePaymentLog[], string>({
      query: account => `/purchases/${account}`
    })
  }),
  reducerPath: "logsApi"
});

export const {
  endpoints,
  useGetApprovalsQuery,
  useGetClaimsQuery,
  useGetPurchasesQuery,
  useLazyGetApprovalsQuery,
  useLazyGetClaimsQuery,
  useLazyGetPurchasesQuery
} = logsApi;

export type { GridfireLog, GridfirePaymentLog };
