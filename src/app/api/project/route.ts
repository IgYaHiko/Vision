import { inngest } from "@/inngest/client";
import { NextRequest, NextResponse } from "next/server";

interface UpdateProjectRequest {
  projectId: string;
  shapesData: {  // ✅ renamed to match Convex + Inngest expectation
    shapes: Record<string, unknown>;
    tool: string;
    selected: Record<string, unknown>;
    frameCounter: number;
  };
  viewportData?: {
    scale: number;
    translate: { x: number; y: number };
  };
}

export async function PATCH(request: NextRequest) {
  try {
    const body: UpdateProjectRequest & { userId?: string } = await request.json();
    const { projectId, shapesData, viewportData, userId } = body;

    console.log("[AUTOSAVE RECEIVED]", { projectId, userId, shapesData, viewportData });

    // ✅ Basic validation
    if (!projectId || !shapesData || !userId) {
      return NextResponse.json(
        { error: "ProjectId, shapesData, and userId are required" },
        { status: 400 }
      );
    }

    // ✅ Send correct data to Inngest
    const eventResult = await inngest.send({
      name: "project/autosave.requested",
      data: {
        projectId,
        userId,
        shapesData, // ✅ must be 'shapesData' (not shapeData)
        viewportData,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Project autosave initiated",
      eventId: eventResult.ids[0],
    });
  } catch (error) {
    console.error("[PATCH ERROR]", error);
    return NextResponse.json(
      {
        error: "Failed to autosave project",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
