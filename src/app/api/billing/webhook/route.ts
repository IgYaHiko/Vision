import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks"
import { isPolarWebhookEvents } from "@/lib/polar";
import { PolarWebhookEventsProps } from "@/types/polar";
import { inngest } from "@/inngest/client";
export async function POST(req:NextRequest) {
  const secret = process.env.POLAR_WEBHOOK_SECRET ?? ""
  if(!secret) {
     return new NextResponse('missing polar webhook secret in env, check env file', {status: 500})
  }
  const raw = await req.arrayBuffer()
  const headerObject = Object.fromEntries(req.headers)
  let verified: unknown
  try {
    verified = validateEvent(Buffer.from(raw),headerObject, secret)

  } catch (error) {
    if(error instanceof WebhookVerificationError) {
         return new NextResponse("Invalide signature",{status: 403})
    }
    throw error;
  }
  if(!isPolarWebhookEvents(verified)) {
     return new NextResponse("UnSupported Event", {status: 400})

  }

  const evt: PolarWebhookEventsProps = verified;
  const id = String(evt.id ?? Date.now())

  try {
    await inngest.send({
        name: "polar/webhook.received",
        id,
        data: evt,
    })
  } catch (error) {
    console.log(error)
    return new NextResponse("failed to process webhook", {status: 500})
  }

  return NextResponse.json({ok: true})
    
}