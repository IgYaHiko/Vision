import { fetchMutation } from "convex/nextjs";
import { inngest } from "./client";
import { api } from "../../convex/_generated/api";
import { isPolarWebhookEvents } from "@/lib/polar";
import { RecivedEvent } from "@/types/polar";

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


  }
)