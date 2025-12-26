import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

export const  getProjects = query({
     args: {projectId: v.id('projects')},
     handler: async(ctx,{projectId}) => {
         const userId = await getAuthUserId(ctx)
         if(!userId) throw new Error('Not authenticated')

        const project = await ctx.db.get(projectId)
        if(!project) throw new Error("Project not found")

        if(project.userId !== userId && !project.isPublic) {
           throw new Error('Access Denial')
        }
      return project
     },

})

const getNextProjectNumber = async (ctx: any, userId: string): Promise<number> => {
  const counter = await ctx.db
    .query("project_counter")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first()

  if (!counter) {
    await ctx.db.insert("project_counter", {
      userId,
      nextProject_numner: 2, // ✅ fixed field name
    })
    return 1
  }

  const projectNumber = counter.nextProject_numner // ✅ fixed

  await ctx.db.patch(counter._id, {
    nextProject_numner: projectNumber + 1, // ✅ fixed
  })

  return projectNumber
}


export const createProject = mutation({
     args: {
         userId: v.id('users'),
         name: v.optional(v.string()),
         sketchesData: v.any(),
         thumbnail: v.optional(v.string())
     },
     handler: async (ctx, {userId,sketchesData,name,thumbnail}) => {
        console.log("[convex] Creating Projects for users", userId);
        const projectNumber = await getNextProjectNumber(ctx, userId);
        const projectName = name || `Project ${projectNumber}`
        const projectId = await ctx.db.insert('projects',{
             userId,
             name: projectName,
             sketchesData,
             projectNumber,
             thumbnail,
             lastModified: Date.now(),
             createdAt: Date.now(),
             isPublic: false

        })
        console.log("Project Created",{
             projectId,
             name: projectName,
             projectNumber
        })

        return {
             projectId,
             name:projectName,
             projectNumber
        }

     }
})

export const getUserProject = query({
   args: {
     userId: v.id('users'),
     limit: v.optional(v.number())
   },
   handler: async (ctx,{userId, limit=20}) => {
      const allProject = await ctx.db.query('projects')
      .withIndex('by_userId',(q) => q.eq('userId',userId))
      .order('desc')
      .collect()
      const slicedProject = allProject.slice(0,limit);
      return slicedProject.map((project) => ({
        id: project._id,
        name: project.name,
        projectNumber: project.projectNumber,
        thumbnail: project.thumbnail,
        lastModified: project.lastModified,
        createdAt:  project.createdAt,
        isPublic: project.isPublic

      }))
   }
 
    
})

// In your convex/projects.ts, update the query:
/* export const getProjectStyleGuide = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not Authenticated");

    const project = await ctx.db.get(projectId);
    if (!project) throw new Error('No project found');

    if (project.userId !== userId && !project.isPublic) {
      throw new Error("Access Denied");
    }

    // Return parsed data or null
    if (!project.styleGuide) {
      return null;
    }
    
    try {
      return JSON.parse(project.styleGuide);
    } catch (error) {
      console.error("Failed to parse style guide:", error);
      return null;
    }
  }
}); */
// convex/projects.ts - UPDATE THIS QUERY
export const getProjectStyleGuide = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not Authenticated");

    const project = await ctx.db.get(projectId);
    if (!project) throw new Error('No project found');

    if (project.userId !== userId && !project.isPublic) {
      throw new Error("Access Denied");
    }

    // FIX: Check if styleGuide exists and is a valid string
    if (!project.styleGuide || typeof project.styleGuide !== 'string') {
      return null;
    }
    
    try {
      // Parse the JSON string back to object
      return JSON.parse(project.styleGuide);
    } catch (error) {
      console.error("Failed to parse style guide:", error);
      return null;
    }
  }
});
/* export const updateProjectSketches = mutation({
     args: {
       projectId: v.id('projects'),
       sketchesData: v.any(),
       viewPortData: v.optional(v.any())
     },
     handler: async(ctx, {projectId,sketchesData,viewPortData}) => {
        
         const project = await ctx.db.get(projectId)
         if(!project) throw new Error("Project Not found")

          const updateData: any = {
             sketchesData, 
             lastModified:  Date.now()
          }
         if(viewPortData) {
           updateData.viewPortData = viewPortData
         }
       
        await ctx.db.patch(projectId, updateData)
        console.log("✅[COVEX]:Project auto-save successfull");
        return { success: true }
        

     }
}) */

// convex/projects.ts - UPDATE this mutation
export const updateProjectSketches = mutation({
  args: {
    projectId: v.id('projects'),
    sketchesData: v.any(),
    viewPortData: v.optional(v.any()),
    styleGuide: v.optional(v.string()), // ADD THIS
  },
  handler: async(ctx, { projectId, sketchesData, viewPortData, styleGuide }) => {
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project Not found");

    const updateData: any = {
      sketchesData, 
      lastModified: Date.now()
    };
    
    if (viewPortData) {
      updateData.viewPortData = viewPortData;
    }
    
    // ADD THIS: Save style guide if provided
    if (styleGuide !== undefined) {
      updateData.styleGuide = styleGuide;
      console.log("✅ Style guide saved to project");
    }
    
    await ctx.db.patch(projectId, updateData);
    console.log("✅[CONVEX]: Project update successful");
    return { success: true };
  }
});

export const updateProjectStyleGuide = mutation({
  args: {
    projectId: v.id('projects'),
    styleGuide: v.string(), // IMPORTANT: Must be string (JSON stringified)
  },
  handler: async (ctx, { projectId, styleGuide }) => {
    // Just save it directly
    await ctx.db.patch(projectId, {
      styleGuide: styleGuide,
      lastModified: Date.now(),
    });
    
    console.log("✅ Style guide saved to project:", projectId);
    return { success: true };
  },
});

// In your existing convex/projects.ts, update the mutation:
export const updateProject = mutation({
  args: {
    projectId: v.id('projects'),
    sketchesData: v.optional(v.any()),
    viewPortData: v.optional(v.any()),
    styleGuide: v.optional(v.any()), // Add this
  },
  handler: async(ctx, { projectId, sketchesData, viewPortData, styleGuide }) => {
    const updateData: any = {
      lastModified: Date.now()
    };
    
    if (sketchesData !== undefined) {
      updateData.sketchesData = sketchesData;
    }
    
    if (viewPortData !== undefined) {
      updateData.viewPortData = viewPortData;
    }
    
    if (styleGuide !== undefined) {
      updateData.styleGuide = JSON.stringify(styleGuide); // Convert to string
    }
    
    await ctx.db.patch(projectId, updateData);
    return { success: true };
  }
});