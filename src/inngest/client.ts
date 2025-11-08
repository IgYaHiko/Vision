import {Inngest} from 'inngest'
import {realtimeMiddleware} from '@inngest/realtime'

export const inngest = new Inngest({
    id: "vision",
    middleware: [realtimeMiddleware()]
})