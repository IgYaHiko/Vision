import { addGeneratedUI, FrameShape, Shape, updateShape } from "@/redux/slices/shapes"
import { AppDispatch, useAppSelector } from "@/redux/store"
import { useState } from "react"
import { useDispatch } from "react-redux"
import {downloadBlob, generateFrameSnapShot} from '@/lib/frame-snapshot'
import { nanoid } from "@reduxjs/toolkit"
import { toast } from "sonner"


export const useCanvas = (shape: FrameShape) => {
    const [isGenerating, setIsGenerating] = useState(false)
    const allShapes = useAppSelector((state) => 
      Object.values(state.shapes.shapes?.entities || {}).filter(
        (shape):shape is Shape => shape !== undefined
      )
    )
    const dispatch = useDispatch<AppDispatch>()
    const handleGenerateDesign = async () => {
        try {
          setIsGenerating(true)
          const snapShot = await generateFrameSnapShot(shape,allShapes)
          downloadBlob(snapShot, `frame-${shape.frameNumber}-snapshot.png`)
          const formData = new FormData()
          formData.append('image',snapShot,`frame-${shape.frameNumber}.png`)
          formData.append('frameNumber', shape.frameNumber.toString())

          const urlParams = new URLSearchParams(window.location.search)
          const projectId = urlParams.get('project')
          if(projectId) {
             formData.append('projectId',projectId)
          }
          const response = await fetch("/api/generate",{
             method: "POST",
             body: formData
          })

          if(!response.ok) {
             const errorText = await response.text();
             throw new Error(
              `API request failed: ${response.status} ${response.statusText} - ${errorText}`
             )
          }

          const genereatedUIPosition = {
             x:shape.x + shape.w + 50,
             y: shape.y,
             w: Math.max(400, shape.w),
             h: Math.max(300, shape.h)
          }

          const generatedUIID = nanoid()
          dispatch(
             addGeneratedUI({
               ...genereatedUIPosition,
               id: generatedUIID,
               uiSpecData: null,
               sourceFrameId: shape.id
             })
          )

          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          let accumulatedMarkup = ""
          let lastUpdatedTime = 0
          const UPDATED_THROTTLE_MS = 200
          if(reader) {
             try{
                while(true) {
                    const {done, value} = await reader.read()
                    if(done) {
                       dispatch(
                         updateShape({
                           id: generatedUIID,
                           patch: {uiSpecData: accumulatedMarkup}
                         })
                       )
                       break
                    }
                    const chunk = decoder.decode(value)
                    accumulatedMarkup += chunk
                    const now = Date.now()
                    if(now - lastUpdatedTime >= UPDATED_THROTTLE_MS) {
                       dispatch(
                        updateShape({
                           id: generatedUIID,
                           patch: {uiSpecData: accumulatedMarkup}
                        })
                       )
                       lastUpdatedTime = now
                    }
                }
             } finally {
                reader.releaseLock()
             }
          }
        } catch (error) {
            toast.error(
              `Failed to generate UI designs ${error instanceof Error ? error.message : "Unknown Error"}`
            )
        } finally {
           setIsGenerating(false)
        }
    }
    
    return {
         isGenerating,
         handleGenerateDesign
    }
}