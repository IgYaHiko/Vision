import { Button } from '@/components/ui/button'
import { useStyleGuide } from '@/hooks/use-style'
import { Loader, Sparkle } from 'lucide-react'
import React from 'react'
interface Props {
    image: any[],
    fileInputRef: React.RefObject<HTMLElement | null>
    projectId: string
}
const StyleGenerateButton = ({fileInputRef,image,projectId}: Props) => {
    const {handleGenerateStyleGuide,isGenerating} = useStyleGuide(projectId,image,fileInputRef)

  return (
     image.length > 0 && (
         <div className='flex justify-end'>
            <Button className='font-mono font-bold text-xs cursor-pointer' >
               {
                isGenerating ? 
                (
                  <>
                  <Loader className='w-4 h-4 animate-spin' />
                  Analyzing....
                  </>
                ) : (
                    <>
                    <Sparkle className='w-4 h-4 fill-amber-400' />
                    Generating With AI
                    </>
                )
               }
            </Button>
         </div>
     )
  )
}

export default StyleGenerateButton