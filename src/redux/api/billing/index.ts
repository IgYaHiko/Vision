import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const BillingApi = createApi({
     reducerPath: 'billingApi',
     baseQuery: fetchBaseQuery({baseUrl: "/api/billing"}),
     endpoints: (builder) => ({
         getCheckout: builder.query({
           query: (userId: string) => ({
             url: '/checkout',
             method: "GET",
             params: {
                 userId,
             }
           })
            
         })
     })
})

export const {useLazyGetCheckoutQuery} = BillingApi