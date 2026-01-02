import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateInspiredImageUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    // ✅ returns string
    return await ctx.storage.generateUploadUrl()
  },
})


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

export const addInspiredImages = mutation({
      args: {
          projectId: v.id('projects'),
          storageId: v.id("_storage")
      },
      handler: async (ctx, {projectId,storageId}) => {
          const userId = await getAuthUserId(ctx)
          if(!userId) {
             throw new Error("Not Authenticated")
          }

          const project = await ctx.db.get(projectId)
          if(!project) {
             throw new Error("No projects")
          }

          if(project.userId !== userId) {
             throw new Error("Not autherise to modify it")
          }

          const currentImage = project.inspirationImage || []
          if(currentImage.includes(storageId)) {
             return {success: true, message: "already added"}
          }



          if(currentImage.length >= 6) {
             throw new Error("Maximun image length achieved")
          }

          const updateImages = [...currentImage, storageId]
          await ctx.db.patch(projectId, {
             inspirationImage: updateImages,
             lastModified: Date.now()
          })


          return {
             success: true,
             message: "Inspirated images added successfully",
             totalImages: updateImages.length
          }
      }
})


export const removeInspireImages = mutation({
     args: {
         projectId: v.id("projects"),
         storageId: v.id("_storage")
     },
     handler: async (ctx,{projectId,storageId}) => {
         const userId = await getAuthUserId(ctx)
         if(!userId) {
             throw new Error("Not authenticated")
         }

         const project = await ctx.db.get(projectId)
         if(!project) {
             throw new Error("No projects")
         }
         if(project.userId !== userId) {
             throw new Error("No authrise for modify")
         }
         const currentImage = project.inspirationImage || []
         const updatedImage = currentImage.filter((id) => id !== storageId)

         await ctx.db.patch(projectId,{
             inspirationImage: updatedImage,
             lastModified: Date.now()
         })

         try {
            //delete the file 
            await ctx.storage.delete(storageId)
         } catch (error) {
            console.warn(
                `Inspiratoion image is not removed from the stoarge, ${error}`
            )
         }

         return {
             success: true,
             message: "Successfully deleted the images",
             remainingImages: updatedImage.length
         }
     }
})