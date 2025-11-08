import { fetchMutation } from "convex/nextjs";
import { inngest } from "./client";
import { api } from "../../convex/_generated/api";

export const autosaveProjectWorkflow = inngest.createFunction(
  { id: "autosave-project-workflow" },
  { event: "project/autosave.requested" },
  async ({ event }) => {
    const { projectId, shapesData, viewportData } = event.data;

    console.log("[AUTOSAVE DATA RECEIVED]", { projectId, shapesData, viewportData });

    try {
      // Ensure shapesData exists; if not, log and skip mutation
      if (!shapesData) {
        console.warn("⚠️ [AUTOSAVE]: shapesData is missing, skipping update.");
        return { success: false, message: "Missing shapesData" };
      }

      await fetchMutation(api.projects.updateProjectSketches, {
        projectId,
        sketchesData: shapesData, // ✅ Correct mapping
        viewportData,
      });

      console.log("✅ [AUTOSAVE]: Project auto-saved successfully.");
      return { success: true };
    } catch (error) {
      console.error("❌ [AUTOSAVE ERROR]:", error);
      throw error;
    }
  }
);
