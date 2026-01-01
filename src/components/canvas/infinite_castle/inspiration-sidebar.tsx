import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ImageIcon, Upload, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React, { useRef, useState } from 'react'
import { mutation } from '../../../../convex/_generated/server'
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'

interface Props {
     isInspirationOpen: boolean
     onclose: () => void
    
}
const InspirationSidebar = ({isInspirationOpen,onclose}: Props) => {

  const [image, setImage] = useState<Props[]>([]);
  const [dragActivity, setDragActivity] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const generateUploadURl = useMutation(api.inspiration.generateInspiredImageUrl)
  const addImages = useMutation(api.inspiration.addInspiredImages)
  const removeInsImg = useMutation(api.inspiration.removeInspireImages)
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
                    "border-2 border-dashed text-center rounded-lg cursor-pointer transition-all duration-200 p-6"
                 )
             }
             >
                <Input
                 type='file'
                 accept='image/*'
                 multiple
                 className='hidden'
                 
                />
                <div className='flex flex-col items-center space-y-3'>
                    <Upload size={20} className='opacity-40' />

                    <p className='opacity-80 text-xs font-mono'>
                      <>
                       Drop images here or <span className='text-blue-400'>browse</span>
                       <br/>
                       <span className=''>
                       {/*  makeit dynamic */}
                        6 images Uploaded
                       </span>
                      </>
                    </p>

                   {/*  warning images uploaded */}
                </div>

            </div>
        </div>

      </div>
  )
}

export default InspirationSidebar