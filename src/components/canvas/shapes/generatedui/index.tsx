import { Button } from '@/components/ui/button';
import { useGeneratedUI } from '@/hooks/use-updated-container';
import { GeneratedUIShape } from '@/redux/slices/shapes'
import { Download, MessageCircle, Workflow } from 'lucide-react';
import React from 'react'

type Props = {
     shapes: GeneratedUIShape;
     toggleChat?: (generatedUIId: string) => void;
     generatedWorkflow?: (generatedUIId: string) => void;
     exportDesign?: (generatedUIId: string, element: HTMLElement | null) => void
}

const GeneratedUI = ({
    shapes,
    toggleChat,
    generatedWorkflow,
    exportDesign
}: Props) => {

  const { sanitizehtml, containerRef } = useGeneratedUI(shapes)
  
  const handleExportDesign = () => {
     if (!shapes.uiSpecData) {
         console.warn("No UI data to export")
         return
     }
     
     // Add null check for exportDesign
     if (exportDesign) {
         exportDesign(shapes.id, containerRef.current)
     } else {
         console.warn("exportDesign function is not provided")
     }
  }

  const handleGenerateWorkFlow = () => {
   

     if(generatedWorkflow) {
         generatedWorkflow(shapes.id)
     }
  }
  const handleToggleChat = () => {
    if(toggleChat) {
         toggleChat(shapes.id)
    }
  }
  return (
     <div
      ref={containerRef}
      className='absolute pointer-events-none'
      style={{
         left: shapes.x,
         top: shapes.y,
         width: shapes.w,
         height: "auto"
      }}
      >
       <div
        className='w-full h-auto rounded-lg border bg-white/15 backdrop-blur-sm '
        style={{
             boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
             padding: "16px",
             height: "auto",
             minHeight: "120px",
             position: "relative"
        }}
       >
        <div
         className='h-auto w-full'
         style={{
             pointerEvents: 'auto',
             height: "auto",
             maxWidth: "100%",
             boxSizing: "border-box"
         }}
        >
            <div
             className='absolute -top-8 right-0 flex items-center gap-2'
            >
             <Button
              size="sm"
              variant={'ghost'}
              disabled={!shapes.uiSpecData}
              style={{pointerEvents: 'auto'}}
              onClick={handleExportDesign} // Add onClick handler
             >
                <Download size={12} />
                Export
             </Button>


              <Button
              size="sm"
              variant={'ghost'}
             
              style={{pointerEvents: 'auto'}}
              onClick={handleGenerateWorkFlow} // Add onClick handler
             >
                <Workflow size={12}/>
                Generate Workflow
             </Button>



              <Button
              size="sm"
              variant={'ghost'}
              
              style={{pointerEvents: 'auto'}}
              onClick={handleToggleChat} // Add onClick handler
             >
                <MessageCircle size={12}/>
                Design Chat
             </Button>
            </div>

            {
               shapes.uiSpecData ? 
               (
                <div
                 className='h-auto'
                 dangerouslySetInnerHTML={{
                     __html: sanitizehtml(shapes.uiSpecData)
                 }}
                >

                </div>
               ) : (

                <div className='flex items-center justify-center p-8'>
                    <span className='opacity-60 animate-pulse font-mono text-xs'>Generating design ....</span>
                </div>
               )
            }

        </div>
       </div> 
       <div
        style={{fontSize: '10px'}}
        className='absolute -top-6 left-0 text-xs rounded whitespace-nowrap text-white/60 bg-black/60'
       >
        Generated UI
       </div>
     </div>
  ) 
}

export default GeneratedUI