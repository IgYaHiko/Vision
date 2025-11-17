import { inngest } from '@/inngest/client'
import { autosaveProjectWorkflow, paymentWithPolar } from '@/inngest/funtion'
import {serve} from 'inngest/next'

export const {GET,POST,PUT} = serve({
   client: inngest,
   functions: [
      autosaveProjectWorkflow,
      paymentWithPolar
   ]
   
})