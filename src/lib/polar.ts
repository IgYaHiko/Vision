import { PolarCustomerProps, PolarOrderProps, PolarPriceProps, PolarProductProps, PolarSubscriptionProps, PolarWebhookEventsProps } from "@/types/polar"


export const isPolarWebhookEvents = (x: unknown): x is PolarWebhookEventsProps<unknown> => {
     return (
        !!x && 
        typeof x === 'object' &&
        'type' in (x as Record<string, unknown>) &&
        'data' in (x as Record<string, unknown>)
     )
}

export const extractSubscription = (data:unknown): PolarSubscriptionProps | null => {
    if(data && typeof data === 'object') {
         const d = data as Record<string, unknown>
         const sub = (
            d.subscription && typeof d.subscription === 'object'
            ? (d.subscription as Record<string, unknown>)
            : d
         ) as Record<string, unknown>
          const id = sub.id
          const status = sub.status

          if(typeof id === 'string' && typeof status === 'string') {
             return {
                 id,
                 status,
                 current_period_end: sub.current_period_end as string | null | undefined,
                 canceled_at: sub.canceled_at as string | undefined | null,
                 cancel_at: sub.cancel_at as string | undefined | null,
                 customer: sub.customer as PolarCustomerProps | undefined | null,
                 customer_id: sub.customer_id as string | undefined | null,
                 seat: (typeof sub.seat === 'number' ? sub.seat : undefined) ?? null,
                 plan_code: sub.plan_code as string | undefined | null,
                 metadata: (sub.metadata as Record<string, undefined> | undefined) ?? null,
                 prices: sub.prices as PolarPriceProps[] | undefined | null,
                 product: sub.product as PolarProductProps | undefined | null,
                 product_id: sub.product_id as string | undefined | null

                 

             }
          }
    }
  return null
   
}

export const extractOrder = (data: unknown): PolarOrderProps | null => {
    if(!data || typeof data !== 'object') return null
    const d = data as Record<string , unknown>
    const id = d.id

    if(typeof id !== 'string') return null

    return {
        id,
        billing_reason: d.billing_reason as string | undefined | null,
        subsription_id: d.subsription_id as string | undefined | null,
        customer: d.customer as PolarCustomerProps | undefined | null,
        customer_id: d.customer_id as string | undefined | null,
        metadata: (d.metadata as Record<string, unknown> | undefined) ?? null,
    }
}