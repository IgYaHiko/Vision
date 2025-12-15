import { CreditBalanceQurey, MoodBoardQuery } from "@/convex/query.config";
import { prompts } from "@/prompts";
import { MoodboardImageProps } from "@/redux/api/moodboard";
import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import z from "zod";

// ---------------- Zod Schemas ----------------
const ColorSwatches = z.object({
  name: z.string(),
  haxcode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hexcode"),
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

// More flexible color schemas
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

// ---------------- Color Swatch Validation Function ----------------
function validateColorSwatches(styleGuide: any) {
  console.log('🔍 Starting color swatch validation...');
  const issues: string[] = [];
  
  // Check if colorSections exist
  if (!styleGuide.colorSections) {
    issues.push('No colorSections found in style guide');
    console.error('❌ No colorSections found');
    return { isValid: false, totalColors: 0, issues };
  }
  
  const sections = ['primary', 'secondary', 'uiComponents', 'utility', 'status'];
  let totalColors = 0;
  
  sections.forEach(section => {
    const sectionData = (styleGuide.colorSections as any)[section];
    
    if (!sectionData) {
      issues.push(`${section}: Missing section data`);
      console.error(`❌ ${section}: Missing section data`);
      return;
    }
    
    const swatches = sectionData.swatches;
    
    if (!swatches || !Array.isArray(swatches)) {
      issues.push(`${section}: No swatches array found`);
      console.error(`❌ ${section}: No swatches array found`);
    } else if (swatches.length === 0) {
      issues.push(`${section}: Empty swatches array`);
      console.warn(`⚠️ ${section}: Empty swatches array`);
    } else {
      totalColors += swatches.length;
      console.log(`✅ ${section}: ${swatches.length} color(s) found`);
      
      // Check each color's format
      swatches.forEach((swatch: any, index: number) => {
        console.log(`   ${index + 1}. ${swatch.name}: ${swatch.haxcode}`);
        
        if (!swatch.haxcode) {
          issues.push(`${section}[${index}]: Missing hex code`);
          console.error(`   ❌ Missing hex code`);
        } else if (!/^#[0-9A-Fa-f]{6}$/.test(swatch.haxcode)) {
          issues.push(`${section}[${index}]: Invalid hex code "${swatch.haxcode}"`);
          console.error(`   ❌ Invalid hex code: ${swatch.haxcode}`);
        }
        
        if (!swatch.name) {
          issues.push(`${section}[${index}]: Missing color name`);
          console.error(`   ❌ Missing color name`);
        }
      });
    }
  });
  
  const isValid = issues.length === 0;
  console.log(`📊 Total colors validated: ${totalColors}`);
  console.log(`📋 Validation issues: ${issues.length}`);
  
  return {
    isValid,
    totalColors,
    issues
  };
}

// ---------------- Route Handler ----------------
export async function POST(req: NextRequest) {
  // Add request ID for tracking
  const requestId = Date.now() + Math.random().toString(36).substr(2, 9);
  console.log(`\n=== [${requestId}] START Style Guide Generation ===`);
  
  try {
    const body = await req.json();
    const { projectId } = body;

    console.log(`[${requestId}] Project ID:`, projectId);

    if (!projectId) {
      console.error(`[${requestId}] ❌ No project ID provided`);
      return NextResponse.json(
        { error: "Project Id is required" },
        { status: 400 }
      );
    }

    // ---------------- Credit Check ----------------
    console.log(`[${requestId}] Checking credits...`);
    const { ok, balance } = await CreditBalanceQurey();
    if (!ok) {
      console.error(`[${requestId}] ❌ Failed to get credit balance`);
      return NextResponse.json(
        { error: "Failed to get credit balance" },
        { status: 500 }
      );
    }

    console.log(`[${requestId}] Credits available:`, balance);

    if (balance === 0) {
      console.error(`[${requestId}] ❌ Insufficient credits`);
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 400 }
      );
    }

    // ---------------- Moodboard Fetch ----------------
    console.log(`[${requestId}] Fetching moodboard images...`);
    const moodboardImages = await MoodBoardQuery(projectId);
    if (!moodboardImages || moodboardImages.imges._valueJSON.length === 0) {
      console.error(`[${requestId}] ❌ No moodboard images found`);
      return NextResponse.json(
        { error: "No moodboard images found. Please upload images first." },
        { status: 400 }
      );
    }

    const images = moodboardImages.imges._valueJSON as unknown as MoodboardImageProps[];
    const imageURLs = images
      .map((img) => img.url)
      .filter((url): url is string => Boolean(url));

    console.log(`[${requestId}] Total images from moodboard:`, images.length);
    console.log(`[${requestId}] Valid image URLs:`, imageURLs.length);

    if (imageURLs.length === 0) {
      console.error(`[${requestId}] ❌ No valid image URLs found`);
      return NextResponse.json(
        { error: "No valid image URLs found" },
        { status: 400 }
      );
    }

    // Log first few image URLs (truncated for readability)
    imageURLs.slice(0, 3).forEach((url, i) => {
      console.log(`[${requestId}] Image ${i + 1}:`, url.substring(0, 50) + '...');
    });

    // Use your system prompt from prompts file
    const systemPrompt = prompts.styleGuide || `You are a professional UI/UX designer. Analyze moodboard images and generate a comprehensive design system.`;
    
    // Create the full prompt by combining system and user instructions
    const fullPrompt = `${systemPrompt}

Analyze these ${imageURLs.length} moodboard image(s) and generate a design system.

REQUIREMENTS:
1. Extract colors that work harmoniously together
2. Create typography that matches the aesthetic

COLOR SECTIONS (each must have at least 1 color):
- Primary Colors: Main brand colors (1-4 colors)
- Secondary & Accent Colors: Supporting colors (1-4 colors)
- UI Component Colors: For buttons, cards, etc. (1-6 colors)
- Utility & Form Colors: Neutral colors (1-3 colors)
- Status & Feedback Colors: Success, warning, error (1-3 colors)

TYPOGRAPHY: At least 1 section with 1+ font styles

FORMAT REQUIREMENTS:
- Hex codes must be valid 6-character format: #RRGGBB
- Font weights should be numeric: 400, 700, etc.
- Return only the JSON object matching the schema.`;

    console.log(`[${requestId}] Full prompt length:`, fullPrompt.length);
    console.log(`[${requestId}] Starting AI generation...`);

    try {
      // ---------------- Generate Style Guide ----------------
      const startTime = Date.now();
      
      console.log(`[${requestId}] 🤖 Calling OpenAI API with ${imageURLs.length} images...`);
      
      // FIX: Use only messages, not prompt and messages together
      const result = await generateObject({
        model: openai("gpt-4o"),
        schema: StyleGuideSchema,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: fullPrompt },
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

      const generationTime = Date.now() - startTime;
      console.log(`[${requestId}] ✅ AI generation completed in ${generationTime}ms`);
      
     /*  // Log AI response details
      console.log(`[${requestId}] AI Finish Reason:`, result.finishReason);
      if (result.usage) {
        console.log(`[${requestId}] AI Usage:`, {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens
        });
      } */
      
      console.log(`[${requestId}] Raw AI object has theme:`, !!result.object.theme);
      console.log(`[${requestId}] Raw AI object has colorSections:`, !!result.object.colorSections);
      console.log(`[${requestId}] Raw AI object has typographySection:`, !!result.object.typographySection);
      
      // Log the theme and description
      console.log(`[${requestId}] Generated theme:`, result.object.theme);
      console.log(`[${requestId}] Description:`, result.object.description?.substring(0, 100) + '...');

      // ---------------- Validate and Clean Response ----------------
      console.log(`[${requestId}] Validating schema...`);
      const validatedData = StyleGuideSchema.parse(result.object);
      console.log(`[${requestId}] ✅ Schema validation passed`);
      
      // Run detailed color validation
      console.log(`\n[${requestId}] 🔍 Running detailed color validation...`);
      const colorValidation = validateColorSwatches(validatedData);
      
      // Clean up any invalid hex codes
      console.log(`[${requestId}] Cleaning hex codes...`);
      const cleanData = {
        ...validatedData,
        colorSections: {
          primary: {
            ...validatedData.colorSections.primary,
            swatches: validatedData.colorSections.primary.swatches.filter(swatch => {
              const isValid = /^#[0-9A-Fa-f]{6}$/.test(swatch.haxcode);
              if (!isValid) {
                console.warn(`[${requestId}] Removing invalid hex from primary:`, swatch.haxcode);
              }
              return isValid;
            })
          },
          secondary: {
            ...validatedData.colorSections.secondary,
            swatches: validatedData.colorSections.secondary.swatches.filter(swatch => {
              const isValid = /^#[0-9A-Fa-f]{6}$/.test(swatch.haxcode);
              if (!isValid) {
                console.warn(`[${requestId}] Removing invalid hex from secondary:`, swatch.haxcode);
              }
              return isValid;
            })
          },
          uiComponents: {
            ...validatedData.colorSections.uiComponents,
            swatches: validatedData.colorSections.uiComponents.swatches.filter(swatch => {
              const isValid = /^#[0-9A-Fa-f]{6}$/.test(swatch.haxcode);
              if (!isValid) {
                console.warn(`[${requestId}] Removing invalid hex from uiComponents:`, swatch.haxcode);
              }
              return isValid;
            })
          },
          utility: {
            ...validatedData.colorSections.utility,
            swatches: validatedData.colorSections.utility.swatches.filter(swatch => {
              const isValid = /^#[0-9A-Fa-f]{6}$/.test(swatch.haxcode);
              if (!isValid) {
                console.warn(`[${requestId}] Removing invalid hex from utility:`, swatch.haxcode);
              }
              return isValid;
            })
          },
          status: {
            ...validatedData.colorSections.status,
            swatches: validatedData.colorSections.status.swatches.filter(swatch => {
              const isValid = /^#[0-9A-Fa-f]{6}$/.test(swatch.haxcode);
              if (!isValid) {
                console.warn(`[${requestId}] Removing invalid hex from status:`, swatch.haxcode);
              }
              return isValid;
            })
          }
        }
      };

      // Calculate final color counts
      const finalColorCounts = {
        primary: cleanData.colorSections.primary.swatches.length,
        secondary: cleanData.colorSections.secondary.swatches.length,
        uiComponents: cleanData.colorSections.uiComponents.swatches.length,
        utility: cleanData.colorSections.utility.swatches.length,
        status: cleanData.colorSections.status.swatches.length,
      };

      const totalFinalColors = Object.values(finalColorCounts).reduce((a, b) => a + b, 0);
      
      console.log(`\n[${requestId}] 📊 FINAL COLOR COUNTS:`);
      Object.entries(finalColorCounts).forEach(([key, count]) => {
        console.log(`   ${key}: ${count} color(s)`);
      });
      console.log(`[${requestId}] 📈 Total colors: ${totalFinalColors}`);
      
      // Check typography
      const typographySections = cleanData.typographySection.length;
      const totalTypographyStyles = cleanData.typographySection.reduce(
        (total, section) => total + section.style.length, 0
      );
      console.log(`[${requestId}] 📝 Typography: ${typographySections} section(s), ${totalTypographyStyles} style(s)`);

      if (totalFinalColors < 5) {
        console.warn(`[${requestId}] ⚠️ Warning: Generated style guide has fewer than 5 colors total`);
      }

      if (totalTypographyStyles === 0) {
        console.warn(`[${requestId}] ⚠️ Warning: No typography styles generated`);
      }

      // ---------------- Return Success ----------------
      console.log(`[${requestId}] ✅ Returning successful response`);
      console.log(`=== [${requestId}] END Style Guide Generation ===\n`);
      
      return NextResponse.json({
        ok: true,
        message: "Style guide generated successfully",
        styleGuide: cleanData,
        // Include debug info in development
        ...(process.env.NODE_ENV === 'development' && {
          _debug: {
            requestId,
            imageCount: imageURLs.length,
            generationTime: `${generationTime}ms`,
            colorValidation: colorValidation,
            finalColorCounts,
            totalColors: totalFinalColors,
            typographySections,
            totalTypographyStyles,
            timestamp: new Date().toISOString(),
          }
        }),
      });
    } catch (generationError) {
      console.error(`[${requestId}] ❌ Error generating style guide:`, generationError);
      
      // Provide more specific error messages for Zod errors
      if (generationError instanceof z.ZodError) {
        console.error(`[${requestId}] Zod validation errors:`, generationError.issues);
        const errorMessages = generationError.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        );
        
        return NextResponse.json(
          { 
            error: "Failed to generate valid style guide format",
            details: errorMessages,
            requestId
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to generate style guide from images",
          requestId
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] ❌ Unhandled error in route:`, error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        requestId
      },
      { status: 500 }
    );
  }
}