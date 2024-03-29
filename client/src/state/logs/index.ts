import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface GridfireLog {
  amount: string;
  blockNumber: number;
  transactionHash: string;
}

interface GridfirePaymentLog {
  amountPaid: string;
  artistId: string;
  artistName: string;
  blockNumber: number;
  editionId?: string;
  releaseId: string;
  releaseTitle: string;
  transactionHash: string;
}

export const logsApi = createApi({
  reducerPath: "logsApi",
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
  })
});

export const {
  useGetApprovalsQuery,
  useGetClaimsQuery,
  useGetPurchasesQuery,
  useLazyGetApprovalsQuery,
  useLazyGetClaimsQuery,
  useLazyGetPurchasesQuery
} = logsApi;
