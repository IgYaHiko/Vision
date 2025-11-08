'use client'
import { useAutoSaveProjectMutation } from '@/redux/api/project'
import { useAppSelector } from '@/redux/store'
import { AlertCircle, CheckCircle, LoaderCircle } from 'lucide-react'
import { useParams, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

const AutosaveButton = () => {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const user = useAppSelector((state) => state.profile)
  const viewport = useAppSelector((state) => state.viewport)
  const shapes = useAppSelector((state) => state.shapes)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')
  const [autoSaveProject,{isLoading: isSaving}] = useAutoSaveProjectMutation()
  const [saveStatus, setSaveStatus] = useState<
  'idle' | 'saved' | 'saving' | 'error' 
  >('idle')
  const isReady = Boolean(projectId && user?.id)
  useEffect(() => {
   if(!isReady) return 
   const stateString = JSON.stringify({
     shapes: shapes,
     viewport: viewport,
   })
   if(stateString === lastSavedRef.current) return
   if(debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout( async () => {
    lastSavedRef.current = stateString
    if(abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    setSaveStatus('saving')

    try {
      await autoSaveProject({
         projectId: projectId as string,
         userId: user?.id as string,
         shapesData: shapes,
         viewPortData: {
             scale: viewport.scale,
             translate: viewport.translate
         }
      }).unwrap()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      if((error as Error)?.name === 'AbortError') return 
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  },1000)
   
   return () => {
     if(debounceRef.current) clearTimeout(debounceRef.current)

   }

  },[
    isReady,
    shapes,
    viewport,
    projectId,
    user?.id,
    autoSaveProject

])

useEffect(() => {
   return () => {
     if(abortRef.current) abortRef.current.abort()
     if(debounceRef.current) clearTimeout(debounceRef.current)
   }
},[])

  if(!isReady) return null
  if(isSaving) {
     return (
         <div className='flex items-center'>
            <LoaderCircle className='w-4 h-4 animate-spin'/>
         </div>
     )
  }
  switch(saveStatus) {
     case 'saved':
     return (
        <div className='flex items-center'> 
         <CheckCircle className='size-4'/>
        </div>
     )
     case 'error':
        return (
        <div className='flex items-center'>
         <AlertCircle className='size-4' />
        </div>
        )

     default: 
     return <></>
  }
 
}

export default AutosaveButton