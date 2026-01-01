import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ImageIcon, Trash, Upload, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { mutation } from '../../../../convex/_generated/server'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import { addInspiredImages } from '../../../../convex/inspiration'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

interface InspirationSidebarProps {
     isInspirationOpen: boolean;
     onclose: () => void;
    
}

interface Props {
     id: string;
     file?: File;
     url?: string;
     storageId?: string;
     uploaded: boolean;
     uploading: boolean;
     error?: string;
     isFromServer?: boolean
}
const InspirationSidebar = ({isInspirationOpen,onclose}: InspirationSidebarProps) => {

  const [image, setImage] = useState<Props[]>([]);
  const [dragActivity, setDragActivity] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const generateUploadURl = useMutation(api.inspiration.generateInspiredImageUrl)
  const addImages = useMutation(api.inspiration.addInspiredImages)
  const removeInsImg = useMutation(api.inspiration.removeInspireImages)
  const existingImg = useQuery(
    api.inspiration.getInspirationOnImages, 
    projectId ? {projectId: projectId as Id<'projects'>} : "skip"
)
   useEffect(() => {
       if(existingImg && existingImg.length > 0) {
         const serverImg: Props[] = existingImg.map((img) => ({
             id: img.id,
             storageId: img.storageId,
             url: img.url || undefined,
             uploaded: true,
             uploading: true,
             isFromServer: true
         }))

         setImage((p) => {
             const localImg = p.filter((img) => !img.isFromServer)
             return [...serverImg, ...localImg]
         })
       } else if(existingImg && existingImg.length === 0) {
             setImage((p) => p.filter((i) => !i.isFromServer))
       }
   },[existingImg])

   const uploadImg = useCallback(
  async (file: File): Promise<{ storageId: string }> => {
       try {
          const uploadUrl = await generateUploadURl()

    if (!uploadUrl) {
      throw new Error("Failed to generate upload URL")
    }

    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    })

    if (!result.ok) {
      throw new Error("Upload failed")
    }

    // Convex-style: storageId is usually returned from the URL itself
    const { storageId } = await result.json()

    if(projectId) {
         await addImages({
            projectId: projectId as Id<'projects'>,
            storageId: storageId as Id<'_storage'>
         })
    }

    return { storageId }
       } catch (error) {
         throw  error
       }
  },
  [generateUploadURl,addImages, projectId]
)


   const handleFileSelect = useCallback((files: FileList | null) => {
            if(!files || files.length === 0) return


            const newImages: Props[] = Array.from(files)
            .filter((file) => file.type.startsWith('image/'))
            .slice(0,6 - image.length)
            .map((file) => ({
                 id: `temp-${Date.now()}-${Math.random()}`,
                 file,
                 url: URL.createObjectURL(file),
                 uploaded: false,
                 uploading: false
            }))

            if(newImages.length > 0) {
                 setImage((prev) => [...prev, ...newImages])
                 newImages.forEach(async (image) => {
                    setImage((prev) => 
                     prev.map((img) => 
                         img.id === image.id ? {...img, uploading: true} : img
                    )
                    )

                    try {
                       const {storageId} = await uploadImg(image.file!)
                       setImage((prev) => 
                        prev.map((img) => 
                           img.id === image.id ? {
                                ...img,
                                storageId,
                                uploaded: true,
                                uploading: false,
                                isFromServer: true
                           } : img
                        
                        )
                    )
                    } catch (error) {
                        setImage((prev) => 
                          prev.map((img) => 
                          img.id === image.id ? {...img, uploading: false, error: "Uploading failed"} : img
                        )
                        )
                    }
                 })
            }
   },[image.length, uploadImg])

   const handleDrag = useCallback((e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            if(e.type === 'dragenter' || e.type === 'dragover') {
                 setDragActivity(true)
            } else if(e.type === 'dragleave') {
                 setDragActivity(false)
            }
   },[])

  const clearAllimg = () => {}
   const handleDrop = useCallback((e: React.DragEvent) => {
          e.preventDefault()
          e.stopPropagation()
          setDragActivity(false)
          if(e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files)
          }
   },[handleFileSelect])
  return (
      <div
       className={
        cn(
             "fixed left-5 top-1/2 -translate-y-1/2 w-80 p-4 z-50 rounded-lg backdrop-blur-2xl backdrop-saturate-150  border border-white/[0.12] shadow-xl shadow-black/20 transition-transform duration-300 ",

              'bg-[#0c0c0c] border-white/10',
                   'shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-2px_-2px_6px_rgba(255,255,255,0.07),0_1px_4px_rgba(0,0,0,0.6)]'
        )
       }
      >
        <div className='py-4 px-2 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-8rem)]'>
            <div className='flex items-center justify-between'>
                <ImageIcon size={17} />
                <p className='font-mono text-xs'>Inspiration Image</p>
            </div>

            <div>
              <X className='cursor-pointer' onClick={onclose} size={20} />
            </div>


            <div
             className={

                // dragable items
                 cn(
                    "border-2 border-dashed text-center rounded-lg cursor-pointer transition-all duration-200 p-6",
                    dragActivity ? "border-blue-400 bg-blue-500/10" : image.length < 6 ? 
                    "border-white/20 hover:border-white/40 hover:bg-white/5" : 
                    "border-white/10 bg-white/5 cursor-not-allowed opacity-50"
                 )
             }  

             onDragEnter={handleDrag}
             onDragLeave={handleDrag}
             onDragOver={handleDrag}
             onDrop={handleDrop}
             onClick={() => image.length < 6 && fileInputRef.current?.click() }
             >
                <Input
                 ref={fileInputRef}
                 type='file'
                 accept='image/*'
                 multiple
                 className='hidden'
                 onChange={(e) => handleFileSelect(e.target.files)}
                 
                />
                <div className='flex flex-col items-center space-y-3'>
                    <Upload size={20} className='opacity-40' />

                    <p className='opacity-80 text-xs font-mono'>
                     {
                        image.length < 6 ? (
                            <>
                            Drop Images here {" "}
                            <span className='text-blue-400'>Browse</span>
                            <br/>
                            <span>
                                {image.length}/6 images uploaded
                            </span>
                            </>
                        ) : (
                            "Maximum Images Reached"
                        )
                     }
                    </p>

                  
                </div>

            </div>
        </div>
           
                   {
                    image.length && (
                         <div className='space'>
                        <div className='flex items-center justify-between'>
                            <Label className='font-mono text-xs'>
                                Uploaded Images {image.length}
                            </Label>

                           <Button
                            variant={"default"}
                            onClick={clearAllimg}
                            size={"sm"}
                            className='text-xs font-xs text-red-500 font-mono cursor-pointer hover:scale-102 bg-red-500/10 hover:bg-red-500/30 hover:text-red-500'
                           >
                            <Trash/>
                            Clear All
                           </Button>
                        </div>

                        <div className=' grid grid-cols-2'>
                            {
                                image.map((imag) => (
                                    <Image
                                     key={imag.id}
                                     width={100}
                                     height={100}
                                     src={imag.url || "f"}
                                     alt=''
                                    />
                                ))
                            }
                        </div>
                    </div>
                    )
                   }
               
      </div>
  )
}

export default InspirationSidebar