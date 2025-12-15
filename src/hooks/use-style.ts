import { MoodboardImageProps } from "@/redux/api/moodboard";
import { useGenerateStyleGuideMutation } from "@/redux/api/style-guide";
import { useRouter } from "next/navigation";

import { RefObject } from "react";
import { toast } from "sonner";

export const useStyleGuide = (
    projectId: string,
    image: MoodboardImageProps[],
    fileInputRef: RefObject<HTMLElement | null>
) => {
     console.log("ProjectID:", projectId)
     const [generateStyleGuide, {isLoading: isGenerating}] = useGenerateStyleGuideMutation()
     const router = useRouter()
     const handleUploadClick = () => {
  fileInputRef.current?.click()
}


     const handleGenerateStyleGuide = async () => {
         if(!projectId) {
             toast.error("No project ID ")
             return
         }

         if(image.length === 0) {
             toast.error("Please upload atleast one image")
             return
         }

         if(image.some((img) => img.uploading)) {
             toast.error("Wait fo all images to finish uploading...",{
                 id: "style-guide-generation"
             })
             return
         }

         try {
            toast.loading("Analyzing mood board images")
            const result = await generateStyleGuide({projectId}).unwrap()
            if(!result.success) {
                 toast.error(result.message,{id: 'style-guide-generation'})
                 return
            }
            router.refresh()
            toast.success("style guide generated successfully",{
                 id: 'style-guide-generation'
            })

            setTimeout(() => {
               toast.success("Style Guide is generate switch to the Colors tab to see the results",{duration: 5000})
            }, 1000);


         } catch (error) {
            const errorMessage = 
            error && typeof error === 'object' && 'error' in error
            ? (error as {error: string}).error
            : 'failed to genereate style guide'
            toast.error(errorMessage,{id: "style-guide-generation"})
         }
     }

     return {
         handleGenerateStyleGuide,
         handleUploadClick,
         isGenerating
     }
}