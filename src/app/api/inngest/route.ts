import { inngest } from '@/inngest/client'
import { autosaveProjectWorkflow } from '@/inngest/funtion'
import {serve} from 'inngest/next'

export const {GET,POST,PUT} = serve({
   client: inngest,
   functions: [
      autosaveProjectWorkflow
   ]
   
})