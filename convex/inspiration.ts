import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getInspirationOnImages = query({
    args: {
        projectId: v.id('projects'),
    },
    handler: async (ctx,{projectId}) => {
         const userId = await getAuthUserId(ctx)
         if(!userId) throw new Error("not autheticated")

         const project = await ctx.db.get(projectId)
         if(!project || project.userId !== userId ) {
             return []
         }

         const storageId = project.inspirationImage || []
         
         //generate url for each image 
         const image = await Promise.all(
             storageId.map(async (storageId, index) => {
                    try {
                        const url = await ctx.storage.getUrl(storageId)
                        return {
                            id: `inspiration-${storageId}`,
                            storageId,
                            url,
                            uploaded: true,
                            uploading: false,
                            index

                        }
                    } catch (error) {
                      console.warn(
                        `[CONVEX]: Failed to get url for inspiration for storageid: ${storageId}`,
                        error
                      )
                      return null
                    }
             })
         )

         const validImages = image
         .filter((img) => img !== null)
         .sort((a,b) => a!.index - b!.index)

         return validImages
    }
})