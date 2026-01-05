import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ImageIcon, Plus, PlusCircle, PlusCircleIcon, Trash, Upload, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { mutation } from '../../../../convex/_generated/server'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import { addInspiredImages } from '../../../../convex/inspiration'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { toast } from 'sonner'

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
  const isLoadingImages = existingImg === undefined
 

   useEffect(() => {
  if (existingImg === undefined) return // ⛔ wait

  if (existingImg.length > 0) {
    const serverImg: Props[] = existingImg.map((img) => ({
      id: img.id,
      storageId: img.storageId,
      url: img.url || undefined,
      uploaded: true,
      uploading: false,
      isFromServer: true,
    }))

    setImage((prev) => {
      const localImg = prev.filter((img) => !img.isFromServer)
      return [...serverImg, ...localImg]
    })
  } else {
    // loaded & empty
    setImage((prev) => prev.filter((img) => !img.isFromServer))
  }
}, [existingImg])


  /*  const uploadImg = useCallback(
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
) */

const uploadImg = async (
  file: File
): Promise<{ storageId: string }> => {
  try {
    const uploadUrl = await generateUploadURl()

    if (!uploadUrl || typeof uploadUrl !== "string") {
      throw new Error("Failed to generate upload URL")
    }

    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    })

    if (!res.ok) {
      throw new Error("Upload failed")
    }

    const data = await res.json()

    if (!data?.storageId) {
      throw new Error("storageId missing")
    }

    await addImages({
      projectId: projectId as Id<"projects">,
      storageId: data.storageId as Id<"_storage">,
    })

    // ✅ RETURN OBJECT
    return { storageId: data.storageId }
  } catch (error) {
    console.error(error)
    throw error
  }
}




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


// Single image removal function
  const removeSingleImage = useCallback(async (imageToRemove: Props) => {
    // Clean up object URL for local images
    if (imageToRemove.url && !imageToRemove.isFromServer && imageToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }

    // Remove from server if it exists there
    if (imageToRemove.isFromServer && imageToRemove.storageId && projectId) {
      try {
        await removeInsImg({
          projectId: projectId as Id<'projects'>,
          storageId: imageToRemove.storageId as Id<'_storage'>
        });
        toast.success("Image removed successfully");
      } catch (error) {
        console.error("Failed to remove image:", error);
        toast.error("Failed to remove image");
        // Still remove from UI even if server fails
      }
    }

    // Remove from local state
    setImage(prev => prev.filter(img => img.id !== imageToRemove.id));
  }, [projectId, removeInsImg]);


 const clearAllimg = useCallback(async () => {
    if (image.length === 0) return;

    const imagesToRemove = image.filter((img) => 
      img.storageId && img.isFromServer
    );

    // Remove from server
    if (projectId && imagesToRemove.length > 0) {
      try {
        // Remove all server image
        await Promise.all(
          imagesToRemove.map(img => 
            removeInsImg({
              projectId: projectId as Id<'projects'>,
              storageId: img.storageId as Id<'_storage'>
            })
          )
        );
        toast.success("All image removed successfully");
      } catch (error) {
        console.error("Failed to remove some image:", error);
        toast.error("Failed to remove some image");
      }
    }

    // Clean up all object URLs
    image.forEach(img => {
      if (img.url && !img.isFromServer && img.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url);
      }
    });

    // Clear all image from state
    setImage([]);
  }, [image, projectId, removeInsImg]);

  // Clean up object URLs on component unmount
  useEffect(() => {
    return () => {
      image.forEach(img => {
        if (img.url && !img.isFromServer && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [image]);

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
                //background
              'bg-[#0c0c0c] border-white/10',
                   'shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-2px_-2px_6px_rgba(255,255,255,0.07),0_1px_4px_rgba(0,0,0,0.6)]',

              //visibility 
            


        )
       }
      >
        <div className='py-4 px-2 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-8rem)]'>
            <div className='flex items-center justify-between mb-4'>
                <ImageIcon size={17} />
                <p className='font-mono text-xs'>Inspiration Image</p>
            </div>

           {/*  <div className='z-[999]'>
              <X className='cursor-pointer' onClick={onclose} size={20} />
            </div> */}


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
                    (isLoadingImages || image.length) && (
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
<div className="grid grid-cols-2 gap-4 mt-4">
  {/* Render all uploaded images */}
  {image.map((imag) => (
    <div
      key={imag.id}
      className="group relative w-full aspect-square overflow-hidden rounded-lg bg-white/5"
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          removeSingleImage(imag)
        }}
        className="
          absolute top-2 right-2 z-20
          rounded-full bg-red-500 p-1
          opacity-0 scale-75
          transition-all duration-200
          group-hover:opacity-100 group-hover:scale-100
          cursor-pointer
        "
      >
        <X size={10} />
      </button>

      {imag.url && (
        <Image
          src={imag.url}
          alt="inspiration"
          fill
          className="object-cover"
        />
      )}
    </div>
    
  ))}

  {
    image.length < 6 && (
        <button
         onClick={() => fileInputRef.current?.click()}
         className='aspect-square border border-dashed rounded-lg cursor-pointer hover:border-white/20 transition-all duration-300 flex items-center justify-center group'
        >
        <Plus className='w-6 h-6 text-white/20 group-hover:text-white/50 transition-all duration-300' />
        </button>
    )
  }

  {/* Show loading skeletons ONLY when isLoadingImages is true */}
  {isLoadingImages && (
    // Create skeletons for remaining slots (total 6)
    [...Array(Math.max(0, 1 - image.length))].map((_, i) => (
      <div
        key={`skeleton-${i}`}
        className="w-full aspect-square rounded-lg bg-white/10 animate-pulse"
      />
    ))
  )}
</div>



                    </div>
                    )
                   }
               
      </div>
  )
}

export default InspirationSidebar