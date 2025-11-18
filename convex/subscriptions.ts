import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
const DEFAULT_GRANT = 10
const DEFAULT_ROLLOVER_LIMIT = 100
export const hasEntitlement = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const now = Date.now()

    for await (const subs of ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))) {
      const status = String(subs.status || "").toLowerCase()
      const periodOk =
        subs.currentPeriodEnd == null || subs.currentPeriodEnd > now

      if (status === "active" && periodOk) return true
    }

    return false
  },
})


export const getByPolarId = query({
   args: {
      polarSubscriptionId: v.string()
   },
   handler: async (ctx,{polarSubscriptionId}) => {
       return await ctx.db
       .query('subscriptions')
       .withIndex("by_polarSubscriptionId", (q) => 
        q.eq('polarSubscriptionId', polarSubscriptionId) 
      )
      .first()
   }
})


export const getSubscriptionForUser = query( {
   args: {
      userId: v.id("users")
   },
   handler: async (ctx, { userId }) => {
      return await ctx.db
      .query('subscriptions')
      .withIndex('by_userId',(q) => 
      q.eq('userId', userId))
      .first()
      
   }
})


export const upsertFromPolar = mutation({
   args: {
      userId: v.id('users'),
      polarCustomerId: v.string(),
      polarSubscriptionId: v.string(),
      productId: v.optional(v.string()),
      priceId: v.optional(v.string()),
      plancode: v.optional(v.string()),
      status: v.string(),
      currentPeriodEnd: v.optional(v.number()),
      trialEndsAt: v.optional(v.number()),
      cancelAt: v.optional(v.number()),
      canceledAt: v.optional(v.number()),
      seat: v.optional(v.number()),
      metadata: v.optional(v.any()),
      creditsGrantPerPeriod: v.optional(v.number()),
      creditsRollOverLimit: v.optional(v.number())
   },
   handler: async (ctx,args) => {
      console.log('[CONVEX]: starting upsert polar for:',
        {
          userId: args.userId,
          polarSubscriptionId: args.polarSubscriptionId,
          status: args.status
        }

      )
      const existingByPolar = await ctx.db
      .query('subscriptions')
      .withIndex('by_polarSubscriptionId', (q) => 
       q.eq('polarSubscriptionId', args.polarSubscriptionId)
      )
      .first()

     const existingByUser = await ctx.db
     .query('subscriptions')
     .withIndex('by_userId',(q) => 
     q.eq('userId', args.userId)
    )
    .first()

    const base = { 

       
    }
   }
})