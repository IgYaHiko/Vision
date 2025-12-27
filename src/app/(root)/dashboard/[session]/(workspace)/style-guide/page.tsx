import MoodBoardContent from '@/components/style-guide/moodboard/moodboard-content'
import { TabsContent } from '@/components/ui/tabs'
import { MoodBoardQuery, StyleGuideQuery } from '@/convex/query.config'
import { MoodboardImageProps } from '@/redux/api/moodboard'
import { Palette, TypeIcon } from 'lucide-react'
import React from 'react'
import TypographyContent from '@/components/style-guide/typography/typography-content'
import ThemeContent from '@/components/style-guide/colors/theme-content'

interface Props {
  searchParams: Promise<{
    project: string
  }>
}

const Page = async ({ searchParams }: Props) => {
  const projectId = (await searchParams).project

  // Get data from database
  const existingStyleGuide = await StyleGuideQuery(projectId)
  
  // Access the _valueJSON property which contains the actual data
  const guideData = existingStyleGuide?.styleGuide?._valueJSON
  
  // Transform AI data to match your Redux types
  let colorGuide: any[] = []
  let typographyGuide: any[] = []
  
  console.log('I\'m existingStyleGuide ❤️', existingStyleGuide)
  console.log('I\'m guideData ❤️', guideData)
  
  // Parse the guide data - it might be a string or already an object
  let parsedGuide: any = null
  
  if (guideData) {
    if (typeof guideData === 'string') {
      try {
        parsedGuide = JSON.parse(guideData)
        console.log('Parsed guide from string:', parsedGuide)
      } catch (error) {
        console.error('Error parsing guide JSON:', error)
        parsedGuide = null
      }
    } else {
      parsedGuide = guideData
      console.log('Guide is already an object:', parsedGuide)
    }
  }
  
  if (parsedGuide) {
    // Debug: Check the actual structure
    console.log('Parsed guide has colorSection?', !!parsedGuide.colorSection)
    console.log('Parsed guide colorSection type:', Array.isArray(parsedGuide.colorSection) ? 'array' : typeof parsedGuide.colorSection)
    
    if (parsedGuide.colorSection && Array.isArray(parsedGuide.colorSection)) {
      // The data from DB already has colorSection as array of sections
      // Each section likely has: title, swatchs (or swatches)
      colorGuide = parsedGuide.colorSection.map((section: any) => {
        console.log('Processing color section:', section)
        return {
          title: section.title || 'Color Section',
          swatchs: (section.swatchs || section.swatches || []).map((swatch: any) => ({
            name: swatch.name || 'Color',
            hexColor: swatch.hexColor || swatch.haxcode || swatch.color || '#000000',
            description: swatch.description || ''
          }))
        }
      })
      
      console.log('Processed colorGuide:', colorGuide)
    }
    
    // Typography - check the structure
    console.log('Parsed guide has typographySection?', !!parsedGuide.typographySection)
    console.log('Parsed guide typographySection type:', Array.isArray(parsedGuide.typographySection) ? 'array' : typeof parsedGuide.typographySection)
    
    if (parsedGuide.typographySection && Array.isArray(parsedGuide.typographySection)) {
      typographyGuide = parsedGuide.typographySection.map((section: any) => {
        console.log('Processing typography section:', section)
        return {
          title: section.title || 'Typography Section',
          style: (section.style || section.styles || []).map((style: any) => ({
            name: style.name || 'Style',
            fontFamily: style.fontFamily || 'Inter',
            fontSize: style.fontSize || "16px",
            fontWeight: style.fontWeight || "400",
            lineWeight: style.lineHeight || style.lineWeight || "1.5",
            letterSpacing: style.letterSpacing || "0",
            description: style.description || ''
          }))
        }
      })
      
      console.log('Processed typographyGuide:', typographyGuide)
    }
  }
  
  console.log('I\'m colorGuide ❤️', colorGuide)
  console.log('I\'m typographyGuide ❤️', typographyGuide)

  const existingMoodBoard = await MoodBoardQuery(projectId)
  
  // Access 'imges' instead of 'moodBoardImages'
  let guideImage: MoodboardImageProps[] = []
  
  // Check if imges exists and handle it properly
  if (existingMoodBoard?.imges) {
    console.log('Mood board imges found:', existingMoodBoard.imges)
    
    // Try to access _valueJSON from imges
    const imagesData = existingMoodBoard.imges._valueJSON
    
    if (imagesData) {
      if (typeof imagesData === 'string') {
        try {
          guideImage = JSON.parse(imagesData) as MoodboardImageProps[]
        } catch (error) {
          console.error('Error parsing mood board images:', error)
        }
      } else if (Array.isArray(imagesData)) {
        guideImage = imagesData as MoodboardImageProps[]
      }
    }
  }

  return (
    <div>
      <TabsContent value='colors' className='space-y-8'>
        {colorGuide.length === 0 ? (
          <div className='space-y-8'>
            <div className='text-center py-25'>
              <div className='flex-col flex items-center'>
                <div className='bg-muted w-16 h-16 rounded-md flex items-center justify-center'>
                  <Palette className='w-8 h-8 text-muted-foreground' />
                </div>
                <span className='capitalize mt-3 font-black text-2xl' style={{ fontFamily: 'var(--font-montserrat-alternates)' }}>
                  No Color Generated Yet
                </span>
                <p className='font-mono text-xs md:text-md mt-1 opacity-50'>
                  Upload images to your mood board and generate an AI-powered style guide with colors and typography.
                </p>
                {/* Debug info */}
               {/*  <div className='mt-4 p-3 bg-gray-100 rounded text-xs text-left max-w-md'>
                  <p><strong>Debug Info:</strong></p>
                  <p>Project ID: {projectId}</p>
                  <p>Style Guide Found: {existingStyleGuide ? 'Yes' : 'No'}</p>
                  <p>Guide Data Type: {typeof guideData}</p>
                  <p>Parsed Guide: {parsedGuide ? 'Yes' : 'No'}</p>
                  <p>colorSection exists: {parsedGuide?.colorSection ? 'Yes' : 'No'}</p>
                  <p>colorSection is array: {Array.isArray(parsedGuide?.colorSection) ? 'Yes' : 'No'}</p>
                  <p>Processed colors: {colorGuide.length}</p>
                </div> */}
              </div>
            </div>
          </div>
        ) : (
          <ThemeContent colorGuide={colorGuide} />
        )}
      </TabsContent>

      <TabsContent value='typography' className='space-y-8'>
        {typographyGuide.length === 0 ? (
          <div className='space-y-8'>
            <div className='text-center py-25'>
              <div className='flex-col flex items-center'>
                <div className='bg-muted w-16 h-16 rounded-md flex items-center justify-center'>
                  <TypeIcon className='w-8 h-8 text-muted-foreground' />
                </div>
                <span className='capitalize mt-3 font-black text-2xl' style={{ fontFamily: 'var(--font-montserrat-alternates)' }}>
                  No Typography Generated Yet
                </span>
                <p className='font-mono text-xs md:text-md mt-1 opacity-50'>
                  Generate a style guide to see typography recommendations.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <TypographyContent typographyGuide={typographyGuide} />
        )}
      </TabsContent>

      <TabsContent value='moodboard' className='space-y-8'>
        <MoodBoardContent moodboardGuide={guideImage} />
      </TabsContent>
    </div>
  )
}

export default Page