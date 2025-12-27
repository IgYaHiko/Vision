// app/api/generate/style/route.ts - FIXED VERSION
import { CreditBalanceQurey, MoodBoardQuery } from "@/convex/query.config";
import { prompts } from "@/prompts";
import { MoodboardImageProps } from "@/redux/api/moodboard";
import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import z from "zod";
import { adaptAIToRedux } from "@/utils/style-adapters";
import { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";

// ---------------- Zod Schemas ----------------
const ColorSwatches = z.object({
  name: z.string(),
  haxColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hexcode"),
  description: z.string().optional(),
});

const TypographyStyleSchema = z.object({
  name: z.string(),
  fontFamily: z.string(),
  fontWeight: z.string(),
  lineHeight: z.string(),
  letterSpacing: z.string(),
  description: z.string().optional(),
});

const PrimaryColorSchema = z.object({
  title: z.literal("Primary Colors"),
  swatches: z.array(ColorSwatches).min(1, "Need at least 1 color")
});

const SecondaryColorSchema = z.object({
  title: z.literal("Secondary & Accent Colors"),
  swatches: z.array(ColorSwatches).min(1, "Need at least 1 color")
});

const UIComponentsColorSchema = z.object({
  title: z.literal("UI Component Colors"),
  swatches: z.array(ColorSwatches).min(1, "Need at least 1 color")
});

const UtilityColorSchema = z.object({
  title: z.literal("Utility & Form Colors"),
  swatches: z.array(ColorSwatches).min(1, "Need at least 1 color")
});

const StatusColorSchema = z.object({
  title: z.literal("Status & Feedback Colors"),
  swatches: z.array(ColorSwatches).min(1, "Need at least 1 color")
});

const TypographySectionSchema = z.object({
  title: z.string(),
  style: z.array(TypographyStyleSchema).min(1, "Need at least 1 typography style")
});

const StyleGuideSchema = z.object({
  theme: z.string(),
  description: z.string(),
  colorSections: z.object({
    primary: PrimaryColorSchema,
    secondary: SecondaryColorSchema,
    uiComponents: UIComponentsColorSchema,
    utility: UtilityColorSchema,
    status: StatusColorSchema
  }),
  typographySection: z.array(TypographySectionSchema).min(1, "Need at least 1 typography section")
});

export async function POST(req: NextRequest) {
  const requestId = Date.now() + Math.random().toString(36).substr(2, 9);
  console.log(`\n=== [${requestId}] START Style Guide Generation ===`);
  
  try {
    const body = await req.json();
    const { projectId } = body;

    console.log(`[${requestId}] Project ID:`, projectId);

    if (!projectId) {
      return NextResponse.json({ error: "Project Id is required" }, { status: 400 });
    }

    // 1. Check credits
    console.log(`[${requestId}] Checking credits...`);
    const { ok, balance } = await CreditBalanceQurey();
    if (!ok) {
      return NextResponse.json({ error: "Failed to get credit balance" }, { status: 500 });
    }
    if (balance === 0) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 });
    }

    // 2. Get moodboard images FIRST (we'll handle sketches differently)
    console.log(`[${requestId}] Fetching moodboard images...`);
    const moodboardImages = await MoodBoardQuery(projectId);
    if (!moodboardImages || moodboardImages.imges._valueJSON.length === 0) {
      return NextResponse.json(
        { error: "No moodboard images found. Please upload images first." },
        { status: 400 }
      );
    }

    const images = moodboardImages.imges._valueJSON as unknown as MoodboardImageProps[];
    const imageURLs = images.map((img) => img.url).filter((url): url is string => Boolean(url));

    if (imageURLs.length === 0) {
      return NextResponse.json({ error: "No valid image URLs found" }, { status: 400 });
    }

    // 3. DEBUG: Check what prompts.styleGuide actually is
    console.log(`[${requestId}] prompts.styleGuide type:`, typeof prompts.styleGuide);
    console.log(`[${requestId}] prompts.styleGuide keys:`, prompts.styleGuide ? Object.keys(prompts.styleGuide) : 'null');
    
    // EXTRACT THE SYSTEM PROMPT STRING
    let systemPromptText: string;
    
    if (typeof prompts.styleGuide === 'string') {
      systemPromptText = prompts.styleGuide;
    } else if (prompts.styleGuide && typeof prompts.styleGuide === 'object') {
      // The error shows it's an object with a system property
      const promptObj = prompts.styleGuide as any;
      console.log(`[${requestId}] Prompt object structure:`, JSON.stringify(promptObj, null, 2).substring(0, 500));
      
      // Extract the system prompt text
      if (promptObj.system && typeof promptObj.system === 'string') {
        systemPromptText = promptObj.system;
        console.log(`[${requestId}] ✅ Using system property from object`);
      } else if (promptObj.text && typeof promptObj.text === 'string') {
        systemPromptText = promptObj.text;
        console.log(`[${requestId}] Using text property from object`);
      } else {
        // If we can't extract, use a default
        systemPromptText = "You are a professional UI/UX designer. Analyze moodboard images and generate a comprehensive design system.";
        console.log(`[${requestId}] ⚠️ Could not extract text, using default`);
      }
    } else {
      systemPromptText = "You are a professional UI/UX designer. Analyze moodboard images and generate a comprehensive design system.";
    }

    console.log(`[${requestId}] Final system prompt length:`, systemPromptText.length);
    console.log(`[${requestId}] First 200 chars:`, systemPromptText.substring(0, 200));

    // 5. Generate AI style guide
    console.log(`[${requestId}] Generating AI style guide...`);
    
    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: StyleGuideSchema,
      system: systemPromptText, // Use system parameter for the base prompt
      messages: [
        {
          role: "user" as const,
          content: [
            { 
              type: "text" as const, 
              text: `Analyze these ${imageURLs.length} moodboard image(s) and generate a design system.

IMPORTANT FORMAT REQUIREMENTS:
1. Use "haxColor" property name for all hex color codes
2. All hex codes must be valid 6-character format: #RRGGBB
3. Return ONLY valid JSON that matches the schema

COLOR SECTIONS (each must have at least 1 color):
- Primary Colors: Main brand colors
- Secondary & Accent Colors: Supporting colors  
- UI Component Colors: For buttons, cards, etc.
- Utility & Form Colors: Neutral colors
- Status & Feedback Colors: Success, warning, error

TYPOGRAPHY: At least 1 section with 1+ font styles

Return ONLY the JSON object matching the schema, no additional text.`
            },
            ...imageURLs.map((url) => ({ 
              type: "image" as const, 
              image: url 
            }))
          ]
        }
      ],
      temperature: 0.2,
      maxRetries: 2,
    });

    console.log(`[${requestId}] ✅ AI generation completed`);

    // 6. Validate and clean data
    const validatedData = StyleGuideSchema.parse(result.object);
    
    const cleanData = {
      ...validatedData,
      colorSections: {
        primary: {
          ...validatedData.colorSections.primary,
          swatches: validatedData.colorSections.primary.swatches
            .filter(swatch => /^#[0-9A-Fa-f]{6}$/.test(swatch.haxColor))
            .map(swatch => ({ ...swatch, haxColor: swatch.haxColor.toUpperCase() }))
        },
        secondary: {
          ...validatedData.colorSections.secondary,
          swatches: validatedData.colorSections.secondary.swatches
            .filter(swatch => /^#[0-9A-Fa-f]{6}$/.test(swatch.haxColor))
            .map(swatch => ({ ...swatch, haxColor: swatch.haxColor.toUpperCase() }))
        },
        uiComponents: {
          ...validatedData.colorSections.uiComponents,
          swatches: validatedData.colorSections.uiComponents.swatches
            .filter(swatch => /^#[0-9A-Fa-f]{6}$/.test(swatch.haxColor))
            .map(swatch => ({ ...swatch, haxColor: swatch.haxColor.toUpperCase() }))
        },
        utility: {
          ...validatedData.colorSections.utility,
          swatches: validatedData.colorSections.utility.swatches
            .filter(swatch => /^#[0-9A-Fa-f]{6}$/.test(swatch.haxColor))
            .map(swatch => ({ ...swatch, haxColor: swatch.haxColor.toUpperCase() }))
        },
        status: {
          ...validatedData.colorSections.status,
          swatches: validatedData.colorSections.status.swatches
            .filter(swatch => /^#[0-9A-Fa-f]{6}$/.test(swatch.haxColor))
            .map(swatch => ({ ...swatch, haxColor: swatch.haxColor.toUpperCase() }))
        }
      }
    };

    // 7. Transform to Redux format
    console.log(`[${requestId}] Transforming to Redux format...`);
    const redaxStyleGuide = adaptAIToRedux(cleanData);
    
    console.log(`[${requestId}] Generated theme: ${redaxStyleGuide.theme}`);
    console.log(`[${requestId}] Colors: ${redaxStyleGuide.colorSection.length} sections`);
    console.log(`[${requestId}] Typography: ${redaxStyleGuide.typographySection.length} sections`);

    // 8. SAVE TO DATABASE - Use dedicated style guide mutation
    console.log(`[${requestId}] Saving to database...`);
    
    try {
      // Initialize Convex client
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (!convexUrl) {
        throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
      }
      
      const { ConvexHttpClient } = await import("convex/browser");
      const convex = new ConvexHttpClient(convexUrl);
      
      const projectIdAsId = projectId as Id<"projects">;
      
      // OPTION 1: Use the dedicated updateProjectStyleGuide mutation
      // This only updates styleGuide, doesn't touch sketchesData
      await convex.mutation(api.projects.updateProjectStyleGuide, {
        projectId: projectIdAsId,
        styleGuide: JSON.stringify(redaxStyleGuide)
      });
      
      console.log(`[${requestId}] ✅ Successfully saved style guide using dedicated mutation`);
      
    } catch (dbError: any) {
      console.error(`[${requestId}] ❌ Database save error:`, dbError.message);
      console.log(`[${requestId}] Trying alternative save method...`);
      
      // OPTION 2: Try updateProject mutation
      try {
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL not set");
        
        const { ConvexHttpClient } = await import("convex/browser");
        const convex = new ConvexHttpClient(convexUrl);
        const projectIdAsId = projectId as Id<"projects">;
        
        await convex.mutation(api.projects.updateProject, {
          projectId: projectIdAsId,
          styleGuide: JSON.stringify(redaxStyleGuide)
        });
        
        console.log(`[${requestId}] ✅ Fallback save successful using updateProject`);
      } catch (fallbackError: any) {
        console.error(`[${requestId}] ❌ Fallback also failed:`, fallbackError.message);
        
        // OPTION 3: Last resort - Fetch existing project first
        try {
          console.log(`[${requestId}] Trying last resort: fetching project to preserve sketches...`);
          
          // Import and use the direct get query
          const { api } = await import("../../../../../convex/_generated/api");
          const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
          if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL not set");
          
          const { ConvexHttpClient } = await import("convex/browser");
          const convex = new ConvexHttpClient(convexUrl);
          const projectIdAsId = projectId as Id<"projects">;
          
          // Get the project directly using the get query
          const project = await convex.query(api.projects.getProjects, { 
            projectId: projectIdAsId 
          });
          
          if (!project) {
            throw new Error("Project not found");
          }
          
          // Use updateProjectSketches with existing sketchesData
          await convex.mutation(api.projects.updateProjectSketches, {
            projectId: projectIdAsId,
            sketchesData: project.sketchesData || {}, // Use existing sketches
            styleGuide: JSON.stringify(redaxStyleGuide)
          });
          
          console.log(`[${requestId}] ✅ Last resort save successful - preserved sketches`);
        } catch (lastResortError: any) {
          console.error(`[${requestId}] ❌ All save methods failed:`, lastResortError.message);
          throw lastResortError;
        }
      }
    }

    // 9. Return success
    console.log(`[${requestId}] ✅ Returning response`);
    console.log(`=== [${requestId}] END ===\n`);
    
    return NextResponse.json({
      ok: true,
      message: "Style guide generated successfully",
      styleGuide: redaxStyleGuide,
      preservedSketches: true
    });
    
  } catch (error: any) {
    console.error(`[${requestId}] ❌ Error:`, error.message || error);
    console.error(`[${requestId}] ❌ Stack:`, error.stack);
    
    // More specific error messages
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid AI response format", 
        //@ts-ignore
        details: error.errors 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 });
  }
}