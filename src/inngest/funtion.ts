import { fetchMutation, fetchQuery } from "convex/nextjs";
import { inngest } from "./client";
import { api } from "../../convex/_generated/api";
import { extractOrder, extractSubscription, grantKey, hasEntitled, isPolarWebhookEvents, toMs } from "@/lib/polar";
import { PolarOrderProps, PolarSubscriptionProps, RecivedEvent } from "@/types/polar";
import { Id } from "../../convex/_generated/dataModel";

export const autosaveProjectWorkflow = inngest.createFunction(
  { id: "autosave-project-workflow" },
  { event: "project/autosave.requested" },
  async ({ event }) => {
    const { projectId, shapesData, viewPortData } = event.data;

    console.log("[AUTOSAVE DATA RECEIVED]", { projectId, shapesData, viewPortData });

    try {
      // Ensure shapesData exists; if not, log and skip mutation
      if (!shapesData) {
        console.warn("⚠️ [AUTOSAVE]: shapesData is missing, skipping update.");
        return { success: false, message: "Missing shapesData" };
      }

      await fetchMutation(api.projects.updateProjectSketches, {
        projectId,
        sketchesData: shapesData, // ✅ Correct mapping
        viewPortData,
      });

      console.log("✅ [AUTOSAVE]: Project auto-saved successfully.");
      return { success: true };
    } catch (error) {
      console.error("❌ [AUTOSAVE ERROR]:", error);
      throw error;
    }
  }
);


export const paymentWithPolar = inngest.createFunction(
  {id: 'polar-webhook-handler'},
  {event: "polar/webhook.received"},
  async ({event, step}) => {
    console.log("🚀[INNGEST]: Starting Webhook handler");
    console.log('✅[INNGEST]: Raw event data',
      JSON.stringify(event.data,null, 2)
     )
   if(!isPolarWebhookEvents(event.data)) {
    return
   }

   const incoming = event.data as RecivedEvent
   const type = incoming.type
   const data = incoming.data

   const sub: PolarSubscriptionProps | null = extractSubscription(data)
   const order: PolarOrderProps | null = extractOrder(data)
   if(!sub && ! order) {
    return 
   }

   const userId: Id<'users'> | null = await step.run("resolve-user",
    async() => {
        const metaUserId = 
        (sub?.metadata?.userId as string | undefined) ??
        (order?.metadata?.userId as string | undefined)

        if(metaUserId) {
           console.log("✅[INNGEST]: Using metadata userId",metaUserId)
           return metaUserId as unknown as Id<'users'>
        }

        const email = 
        sub?.customer?.email ??
        order?.customer?.email ??
        null
        console.log("💌[INNGEST]: Customer email:",email);

        if(email) {
          try {
             console.log("👄[INNGEST]: Looking for user by email",email);
           const foundUserId = await fetchQuery(api.user.getUserIdByEmail,{
             email
           })
           console.log("✅[INNGEST]: Found userId by email",foundUserId)
           return foundUserId
          } catch (error) {
            console.error(
              `❌[INNGEST]: Failed to resolve the userId by email ${error}`
            )
            console.error(
              `🪄[INNGEST]: Email looked failed for email: ${email}`
            )
            return null
          }
        }

        console.log(
          `❌[INNGEST]: No email found to looked user`
        )
        return null

    }
   )
   console.log(`✅[INNGEST]: Final resolved userId: ${userId}`)
   if(!userId) {
      console.log(`❌No userId found, skipping the webhook processing`)
      return
   }
    
   const polarSubscriptionId = sub?.id ?? order?.subsription_id ?? ''
   console.log(`❤️[INNGEST]: Polar subscription id: ${polarSubscriptionId}`)
   if(!polarSubscriptionId) {
    console.log(`❌[INNGEST]: No polar subscription id found`)
    return
   }

     const currentPeriodEnd = toMs(sub?.current_period_end)
     const payload = {
          userId,
          polarCustomerId: sub?.customer_id ?? order?.customer_id ?? '', polarSubscriptionId,
          productId: sub?.product_id ?? sub?.product?.id ?? undefined,
          priceId: sub?.prices?.[0]?.id ?? undefined,
          planCode: sub?.plan_code ?? sub?.product?.name ?? undefined,
          status: sub?.status ?? 'updated', currentPeriodEnd,
          trialsEndsAt: toMs(sub?.triel_ends_at),
          cancelAt: toMs(sub?.cancel_at),
          canceledAt: toMs(sub?.canceled_at),
          seats: sub?.seat ?? undefined,
          metaData: data,
          creditsGrantPerPeriod: 10,
          creditsRollOverLimit: 100,

     }

     console.log(
      `[INNGEST]: Subscription Payload ${
        JSON.stringify(payload, null, 2)
      }`
     )

     const subscriptionId = await step.run('upsert-subscription', async() => {
        try {
          console.log(
            `[INNGEST]: Upserting Subscription to convex...`
          )
          console.log(
            `[INNGEST]: Checking for existing subscription first...`
          )

          const existingPolarId = await fetchQuery(
             api.subscriptions.getByPolarId, {
               polarSubscriptionId: payload.polarSubscriptionId
             })
             console.log(`[INNGEST: existing subscription polar ID by: ${
              existingPolarId ? "found" : "not found"
             }`)

            const existingByUser = await fetchQuery(
               api.subscriptions.getSubscriptionForUser,{
                 userId: payload.userId
               }
            )

            console.log(`[INNGEST]: existing subscription by USER Id ${
               existingByUser ? "found" : "not found"
            }`)

            if(existingByUser && existingPolarId && existingByUser?._id !== existingPolarId?._id) {
               console.warn(`❌[INNGEST]: Duplicate id detectes`)
               console.warn(` - By Polar ID: ${existingPolarId}`)
               console.warn(` - By User ID: ${existingByUser}`)
            }

            const result = await fetchMutation(
               api.subscriptions.upsertFromPolar,
               payload
            )

            const allUserSubs = await fetchQuery(api.subscriptions.getAllforUser,{
               userId: payload.userId
            })

            if(allUserSubs && allUserSubs.length > 1) {
                allUserSubs.forEach((sub, index) => {
                    console.warn(
                      `${index + 1}, ID: ${sub._id}, POLAR_ID: ${sub.polarSubscriptionId}, Status: ${sub.status}`
                    )
                })
            }
            return result

        } catch (error) {
          console.error(`❌[INNGEST]: Failed to upsert subscription: ${error}`)
          console.error(`[INNGEST]: Failed Payload ${JSON.stringify(payload, null,2)}`)
          throw error
        }
     })

     const looksCreate = /subscription\.create/i.test(type)
     const looksReNew = /subscription\.renew|order\.created|invoice\.paid|order\.paid/i.test(type)
     const entitled = hasEntitled(payload.status)
     console.log('[INNGEST]: credit grant analysis:')
     console.log('- Event type:', type)
     console.log('- looks like create:', looksCreate)
     console.log('- looks likfe renew:', looksReNew)
     console.log('- user entitled:', entitled)
     console.log('- Status:', payload.status)
     const idk = grantKey(polarSubscriptionId, currentPeriodEnd,incoming.id)
     console.log(`🔑[INNGEST]: Idempontency Key: ${idk}`)

     if(entitled && (looksCreate || looksReNew || true)) {
       const grant = await step.run('grant-credits', async() => {
          try {
            console.log('[INNGEST]: Grant credits to subscription')
            const result = await fetchMutation(api.subscriptions.grantCreditsIfNeeded,{
               subscriptionId,
               forceGrant: true,
               idempotencyKey: idk,
               amount: 10,
               reason: looksCreate ? 'initial-grant' : 'periodic-grant'
            })

            console.log(`[INNGEST]: Create Grant successfully: ${result}`)
            return result
          } catch (error) {
            console.error(`❌[INNGEST]: Grant not credited successfully: ${error}`)
            throw error
          }
       })
         console.log(`💌[INNEGST]: Grant result: ${grant}`)
         if(grant.ok && !('skipped' in grant  && grant.skipped)) {
           await step.sendEvent('credits-grant', {
             name: 'billing/credits.granted',
             id: `credits-granted:${polarSubscriptionId}:${currentPeriodEnd ?? 'first' }`,
             data: {
               userId,
               amount: 'granted' in grant ? (grant.granted ?? 10) : 10,
               balance: 'balance' in grant ? grant.balance : undefined,
               periodEnd: currentPeriodEnd
              },
           })
           console.log(`[INNGEST]: Credit Granted event send`)
         } else {
           console.log(`[INNGEST]: Credit granted was failed or skipped`)
         }
         
     } else {
       console.log(`[INNGEST]: Credit granting condition not met.....`)
     }  

     await step.sendEvent('sub-synced',{
       name: 'billing/subscription.synced',
       id: 'sub-synced',
       data: {
         userId,
         polarSubscriptionId,
         status: payload.status,
         currentPeriodEnd
       }
     })

      console.log(`[INNGEST]: subscription synced event send`)
      if(currentPeriodEnd && currentPeriodEnd > Date.now()) {
         const runAt  = new Date( 
           Math.max(Date.now() + 5000, currentPeriodEnd - 3 * 24 * 60 * 60 * 1000)
         )
         await step.sleepUntil('wait-until-expiry', runAt)
         const stillEntitled = await step.run('check-entitlement', async () => {
             try {
               console.log(`[INNGEST]: Checking entitlement status...`)
               const result = await fetchQuery(api.subscriptions.hasEntitlement,{
                 userId
               })
               console.log("[INNGEST]: Checking entitlement status", result)
               return result
             } catch (error) {
               console.error('[INNGEST]: Failed to check entitlement')
               throw error
             }
         })
          if(stillEntitled) {
             await step.sendEvent('pre-expiry',{
               name: 'billing/subscription.pre_expiry',
               data: {
                  userId,
                  runAt: runAt.toISOString(),
                  periodEnd: currentPeriodEnd,
               },
             })
          } 
      }
  }
)