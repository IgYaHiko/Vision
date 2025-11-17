import { PolarWebhookEventsProps } from "@/types/polar"

export const isPolarWebhookEvents = (x: unknown): x is PolarWebhookEventsProps<unknown> => {
     return (
        !!x && 
        typeof x === 'object' &&
        'type' in (x as Record<string, unknown>) &&
        'data' in (x as Record<string, unknown>)
     )
}