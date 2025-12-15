import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

const DEFAULT_GRANT = 10
const DEFAULT_ROLLOVER_LIMIT = 100
const ENTITLED = new Set(['active','trialing'])
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
         userId: args.userId,
         polarCustomerId: args.polarCustomerId,
         polarSubscriptionId: args.polarSubscriptionId,
         productId: args.productId,
         priceId: args.priceId,
         planCode: args.plancode,
         status: args.status,
         currentPeriodEnd: args.currentPeriodEnd,
         trialEndsAt: args.trialEndsAt,
         cancelAt: args.cancelAt,
         canceledAt: args.canceledAt,
         seat: args.seat,
         metadata: args.metadata,
         creditsGrantPerPeriod: 
         args.creditsGrantPerPeriod ??
         existingByPolar?.creditsGrantPerPeriod ?? 
         existingByUser?.creditsGrantPerPeriod ??
         DEFAULT_GRANT,

         creditsRollOverLimit: 
         args.creditsRollOverLimit ??
         existingByPolar?.creditsRollOverLimit ??
         existingByUser?.creditsRollOverLimit ??
         DEFAULT_ROLLOVER_LIMIT
       
    }
      if(existingByPolar) {
          if(existingByPolar?.userId === args.userId) {
             await ctx.db.patch(existingByPolar._id, base)
             return existingByPolar._id
          } else {
              const existingSubscription = await ctx.db
             .query('subscriptions')
             .withIndex('by_userId',(q) => 
             q.eq('userId', args.userId))
             .first()

             if(existingSubscription) {
                const preserveData = {
                   creditsBalance: existingSubscription?.creditsBalance,
                   lastGrantCursor: existingSubscription?.lastGrantCursor
                }

                await ctx.db.patch(existingSubscription._id, {
                   ...base,
                   ...preserveData
                })
                return existingSubscription._id
             } else {
                const newId = await ctx.db.insert('subscriptions', {
                  ...base,
                  creditsBalance: 0,
                  lastGrantCursor: undefined,
                })
                console.log(`[CONVEX]: Created subscription successfully ${newId}`)
                return newId
             }

          }

      }

      if(existingByUser) {
          const preserveData = {
             creditsBalance: existingByUser?.creditsBalance,
             lastGrantCursor: existingByUser?.lastGrantCursor
          }
          await ctx.db.patch(existingByUser._id, {
            ...base,
            ...preserveData
          })
          return existingByUser._id
      }

      const newId = await ctx.db.insert('subscriptions',{
          ...base,
          creditsBalance: 0,
          lastGrantCursor: undefined
      })
      return newId

   }
})


export const getAllforUser = query({
    args: {userId: v.id('users')},
    handler: async (ctx, {userId}) => {
       return await ctx.db
       .query('subscriptions')
       .withIndex('by_userId', (q) => q.eq('userId', userId))
       .collect()
    }
})

/* export const grantCreditsIfNeeded = mutation({
    args: {
      subscriptionId: v.id('subscriptions'),
      idempotencyKey: v.string(),
      amount: v.optional(v.number()),
      reason: v.optional(v.string())
    },
    handler: async(ctx,args) => {
        const duplicate = await ctx.db.query('credit_ledger')
        .withIndex('by_idempotencyKey',(q) => q.eq('idempotencyKey',args.idempotencyKey))
        .first()

        if(duplicate) return {ok: true, skipped: true, reason: 'duplicate_ledger'}
        const sub = await ctx.db.get(args.subscriptionId)
        if(!sub) return {ok: false, error: 'subscription-not-found'}

        if(sub.lastGrantCursor === args.idempotencyKey) {
          return {ok: true, skipped: true, reason: 'cursor-match'}
        }
        if(!ENTITLED.has(sub.status)) {
         return {ok: true, skipped: true, reason: 'not-entitle'}
        }

        const grant = args.amount ?? sub?.creditsGrantPerPeriod ?? DEFAULT_GRANT
        if(grant <= 0) return {ok: true, skipped: true, reason: 'zero-grant'}

        const next = Math.min(
          sub?.creditsBalance + grant,
          sub?.creditsRollOverLimit ?? DEFAULT_ROLLOVER_LIMIT
        )

        await ctx.db.patch(args.subscriptionId,{
          creditsBalance: next,
          lastGrantCursor: args.idempotencyKey
        })

        await ctx.db.insert('credit_ledger',{
          userId: sub.userId,
          subscriptionId: args.subscriptionId,
          amount: grant,
          type: 'grant',
          reason: args.reason ?? "periodic-grant",
          idempotencyKey: args.idempotencyKey,
          meta: {prev: sub.creditsBalance, next}
          })
          return {ok: true, granted: grant, balance: next}
    }
}) */


    export const grantCreditsIfNeeded = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    idempotencyKey: v.string(),
    amount: v.optional(v.number()),
    reason: v.optional(v.string()),

    // ✅ CORRECT PLACE
    forceGrant: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const isForced = args.forceGrant === true;

    const duplicate = await ctx.db
      .query("credit_ledger")
      .withIndex("by_idempotencyKey", q =>
        q.eq("idempotencyKey", args.idempotencyKey)
      )
      .first();

    if (duplicate) {
      return { ok: true, skipped: true, reason: "duplicate_ledger" };
    }

    const sub = await ctx.db.get(args.subscriptionId);
    if (!sub) return { ok: false, error: "subscription-not-found" };

    // 🔥 BYPASS POLAR ONLY IF forceGrant = true
    if (!isForced) {
      if (sub.lastGrantCursor === args.idempotencyKey) {
        return { ok: true, skipped: true, reason: "cursor-match" };
      }

      if (!ENTITLED.has(sub.status)) {
        return { ok: true, skipped: true, reason: "not-entitled" };
      }
    }

    const grant = isForced
      ? 10
      : args.amount ?? sub.creditsGrantPerPeriod ?? DEFAULT_GRANT;

    const next = Math.min(
      sub.creditsBalance + grant,
      sub.creditsRollOverLimit ?? DEFAULT_ROLLOVER_LIMIT
    );

    await ctx.db.patch(args.subscriptionId, {
      creditsBalance: next,
      lastGrantCursor: args.idempotencyKey,
    });

    await ctx.db.insert("credit_ledger", {
      userId: sub.userId,
      subscriptionId: args.subscriptionId,
      amount: grant,
      type: "grant",
      reason: args.reason ?? (isForced ? "force-grant" : "periodic-grant"),
      idempotencyKey: args.idempotencyKey,
      meta: {
        forced: isForced,
        prev: sub.creditsBalance,
        next,
      },
    });

    return { ok: true, granted: grant, balance: next };
  },
});

export const getCreditBalance = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "trialing")
        )
      )
      .first()

    return sub?.creditsBalance ?? 10
  },
})
