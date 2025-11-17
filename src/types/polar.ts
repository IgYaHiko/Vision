export interface PolarWebhookEventsProps<TData = unknown> { 
    id: string | number;
    type: string
    data: TData
}
export type RecivedEvent = PolarWebhookEventsProps<unknown>
export interface PolarCustomerProps {
     id: string 
     email: string | null
}

export interface PolarPriceProps {
     id?: string | null;
     recurring_interval?: string | null
}

export interface PolarProductProps {
     id?: string | null;
     name?: string | null
}

export interface PolarSubscriptionProps {
     id: string;
     status: string;
     current_period_end?: string | null;
     triel_ends_at?: string | null;
     cancel_at?: string | null;
     canceled_at?: string | null;
     customer?: PolarCustomerProps | null;
     customer_id?: string | null;
     product?: PolarProductProps | null;
     product_id: string | null | undefined;
     prices?: PolarPriceProps[] | null;
     seat?: number | null;
     plan_code?: string | null;
     metadata?: Record<string, unknown> | null

}

export interface PolarOrderProps {
     id: string;
     billing_reason?: string | null;
     subsription_id?: string | null;
     customer?: PolarCustomerProps | null;
     customer_id?: string | null;
     metadata?: Record<string, unknown> | null;
}