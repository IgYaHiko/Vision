import { CreditBalanceQurey, MoodBoardQuery } from "@/convex/query.config";
import { prompts } from "@/prompts";
import { MoodboardImageProps } from "@/redux/api/moodboard";
import { NextRequest, NextResponse } from "next/server";
import {generateObject} from 'ai'
import {openai} from "@ai-sdk/openai"
import z from "zod";


const ColorSwatches = z.object({
    name: z.string(),
    haxcode: z.string().regex(/^#[0-9A-FA-f]{6}$/, "Must be a valide haxcode"),
    description: z.string().optional()

})
const TypographyStyleSchema = z.object({
     name: z.string(),
     fontFamily: z.string(),
     fontWeight: z.string(),
     lineHeight: z.string(),
     letterSpacing: z.string(),
     description: z.string().optional(),
})
const TypographySectionSchema = z.object({
     title: z.string(),
     style: z.array(TypographyStyleSchema)

})

const PrimaryColorSchema = z.object({
     title: z.literal("Primary Colors"),
     swatches: z.array(ColorSwatches).length(4)
})

const SecondaryColorSchema = z.object({ 
    title: z.literal("Secondary & Accent Colors"),
     swatches: z.array(ColorSwatches).length(4)
})
const UIComponentsColorSchema = z.object({ 
    title: z.literal("UI Component Colors"),
     swatches: z.array(ColorSwatches).length(6)
})

const UtilityColorSchema = z.object({ 
    title: z.literal("Utility & form Colors"),
    swatches: z.array(ColorSwatches).length(3)
})

const StatusColorSchema = z.object({
     title: z.literal("Status & feedback Colors"),
      swatches: z.array(ColorSwatches).length(2)
})


const StyleGuideSchema = z.object({
    theme: z.string(),
    description: z.string(),
    colorSections: z.tuple([
        PrimaryColorSchema,
        SecondaryColorSchema,
        UIComponentsColorSchema,
        UtilityColorSchema,
        StatusColorSchema
    ]),
    typographySection: z.array(TypographySectionSchema).length(3)
})
export async function POST(req:NextRequest) {
    try {
       const body = await req.json()
       const {projectId} = body 
       if(!projectId) {
         return  NextResponse.json(
           { error: "Project Id is required",},
           {status: 400}
         )
       }

       const {ok: balanceOk, balance: creditBalance} = await CreditBalanceQurey()
       if(!balanceOk) {
         return NextResponse.json(
            {error: "failed to get balance"},
            {status: 500}
         )
       }

       if(creditBalance === 0) {
         return NextResponse.json(
            {error: "Failed to get balance"},
            {status: 400}
         )
       }
       const moodboardImages = await MoodBoardQuery(projectId)
       if(!moodboardImages || moodboardImages.imges._valueJSON.length === 0) {
         return NextResponse.json(
            {error: 'NO moodboard image found. Please upload images to the moodboard first'},
            {status: 400}
         )
       }
       const images = moodboardImages.imges._valueJSON as unknown as MoodboardImageProps[]
       const imageURL = images.map((img) => img.url).filter(Boolean)
       const systemPrompt = prompts.styleGuide.system
       const userPrompt = `Analyse these ${imageURL.length} moodboard image and generate a design system: Extract colors that work harmoniously together and create the typography that matches the asthetic. Return Only the json object matching the exact schema structure above`
       const result = await generateObject({
         model: openai('chatgpt-4o-latest'),
         schema: StyleGuideSchema,
         messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: userPrompt
                    },
                    ...imageURL.map((url) => ({
                         type: 'image' as const,
                         image: url as string
                    })),
                ]
            }
         ]
       })
    } catch (error) {
        
    }
}