import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const apiSlice = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: () => ({})
});

export { apiSlice };
