import { GeneratedUIShape, updateShape } from "@/redux/slices/shapes";
import { useAppDispatch } from "@/redux/store";
import { useEffect, useRef } from "react";

export const useGeneratedUI = (shape: GeneratedUIShape) => {
     const dispatch = useAppDispatch()
     const containerRef = useRef<HTMLDivElement>(null)
     useEffect(() => {
        if(containerRef.current && shape.uiSpecData) {
            const timeoutId = setTimeout(() => {
                const actualHeigt = containerRef.current?.offsetHeight || 0
                if(actualHeigt > 0 && Math.abs(actualHeigt - shape.h) > 10) {
                     dispatch(
                        updateShape({
                            id: shape.id,
                            patch: {h: actualHeigt}
                        })
                     )
                }
            },1000)

            return () => clearTimeout(timeoutId)
        }
     },[shape.uiSpecData, shape.id, shape.h, dispatch])

     const sanitizehtml = (html:string) => {
        const sanitized = html
         .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)<\/script>/gi,'')
         .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)<\/iframe>/gi,'')
         .replace(/on\w+="[^"]*"/gi, '')
         .replace(/data:/gi,'') 
         return sanitized
     }

     return {
         sanitizehtml,
         containerRef
     }
}