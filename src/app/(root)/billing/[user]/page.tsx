import Image from 'next/image'
import React from 'react'
import { LOGO } from '../../../../../public/images/images'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Code2, Download, Flashlight, Palette, Ticket, TicketPlus } from 'lucide-react'
import SubscribeButton from '@/components/button/subscription/subscribe-button'

interface Props { 
     params: Promise<{
         user: string
     }>
}
const page = async ({params}:Props) => {
    const {user} = await params
  return (
    <section
       className='py-10'>
        <div className='container mx-auto'>
            <div className='flex flex-col items-center px-5 space-y-10'>
                <div className='flex flex-col items-center justify-center '>
                    <Image
                     alt=''
                     src={LOGO.logo}
                     className='mb-5'
                    />
                    <span style={{fontFamily: 'var(--font-montserrat-alternates)'}} className='text-center text-xl font-black md:text-4xl'>Generate Design With Our Vision</span>
                    <p style={{fontFamily: 'var(--font-montserrat-alternates)'}} className='capitalize text-xl md:text-4xl  text-center font-black'>We'v got something for you</p>
                   <p className='text-md text-center font-mono opacity-60 mt-2'>Upload an image and get instant AI-generated wireframes.</p>
                </div>

            <div className='w-full max-w-xl '>
                <Card className='shadow-lg backdrop-blur-2xl border saturate-150 '>
                 <CardHeader className='mb-4'>
                 <div className='flex flex-col items-center gap-3 mt-2'>
                     <Badge className='font-bold'>Most Popular</Badge>
                     <CardTitle className='font-mono text-2xl '>Standard Plan</CardTitle>
                 </div>
                 <div className='flex items-center justify-center'>
                    <span className='text-5xl font-mono font-black'>$9.99</span>
                    <p className='font-mono font-medium opacity-60 text-xl'>/month</p>
                 </div>
                 </CardHeader>

                 <CardContent>
                    <div className='flex flex-col items-center '>
                        <p className='text-xs font-mono '>Get 10 credits every months to power your AI-assisted design workflow</p>

                        <p className='font-mono text-xs text-center mt-10 max-w-md'>Perfect for freelancing and creators who want reliable access to code generation, export, and their premium features without over-committing.</p>

                        <p className='font-mono text-xs text-center mt-3 max-w-md'>
                          Each credit unlocks one full AI task-whether it's generating UI code from your sketches, exporting polished assets, or running advanced  processing. Simple, predictable, flexible.
                        </p>


                       {/* Included Section */}
    <div className="w-full mt-8 dark:bg-neutral-900 border rounded-xl p-5">
      <p className="text-center text-lg font-mono mb-4">What's Included</p>

      <div className="flex flex-col gap-3">

        {/* Feature Item */}
       <FeatureItem
        icon={<Palette/>}
         title="AI-Powered Design Generation"
  description="Transform your sketches into production-ready code."
       />
       <FeatureItem
        icon={<Download/>}
         title="Premium Asset Exports"
  description="High-quality exports in multiple formats"
       />

 <FeatureItem
        icon={<Code2/>}
         title="Advance Processing"
  description="Run Complex Design operations and transformations"
       />
    <FeatureItem
        icon={<Flashlight/>}
         title="10 Monthly Credits"
  description="Flexible usage for your design needs"
       />
       <FeatureItem
        icon={<Check/>}
         title="Simple Credit System"
  description="Each Credit=One AI task. Use them for code generation, assets export or any preminum feature. Credit refresh monthly, so you get always what you need."
       />

        {/* Add more feature rows here if needed */}
      </div>
      </div>
                    </div>
                 </CardContent>
                 <CardFooter className='w-full flex flex-col gap-3 pb-6 pt-4'> 
                  <SubscribeButton/>
                  <p className='text-xs font-mono opacity-60'>
                    Cancel anytime • No setup fees • Instant access
                  </p>
                 </CardFooter>
                 </Card>

           <div className='flex items-center justify-around mt-5' >
            <div className='flex items-center gap-2 text-xs font-mono opacity-60'>
                <Check
                 className='text-green-300'
                 size={15}
                />
                <p>Secure Payment</p>
            </div>
            <div className='flex items-center gap-2 text-xs font-mono opacity-60'>
                <Check
                 className='text-green-300'
                 size={15}
                />
                <p>30-day Guarantee</p>
            </div>
            <div className='flex items-center gap-2 text-xs font-mono opacity-60'>
                <Check
                 className='text-green-300'
                 size={15}
                />
                <p>24/7 support</p>
            </div>
           </div>
            </div>
                  
            </div>
        </div>

    </section>
  )
}

export default page



const FeatureItem = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) => {
  return (
    <div className="flex items-start gap-4 p-3 rounded-lg border dark:bg-neutral-800">
      <div className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-700">
        {icon}
      </div>

      <div>
        <p className="font-semibold">{title}</p>
        <p className="font-mono text-xs opacity-60">{description}</p>
      </div>
    </div>
  )
}
