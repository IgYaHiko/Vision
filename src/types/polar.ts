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

export interface PolarProductProps {
    id?: string | null
    recurring_interval?: string | null
}
export interface PolarPriceProps {
    id?: string | null;
    name?: string | null
}

export interface PolarSubscription {
     id: string;
     status: string;
     current_period_end?: string | null;
     triel_ends_at?: string | null;
     cancel_at?: string | null;
     canceled_at?: string | null;
     customer?: PolarCustomerProps | null;
     customer_id?: string | null;
     product?: PolarCustomerProps | null;
     product_id: string | null;
     prices?: PolarPriceProps[] | null;
     seat?: string | null;
     plan_code?: string | null;
     metadata?: string | null;

}