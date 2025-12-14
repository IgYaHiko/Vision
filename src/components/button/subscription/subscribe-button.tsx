'use client'
import { Button } from '@/components/ui/button'
import { useSubscribePlan } from '@/hooks/use-billing';
import { Loader2 } from 'lucide-react';
import React from 'react'

interface Props {
   onClick?: () => void;
   disable?: () => void
}
const SubscribeButton = ({onClick,disable}: Props) => {
  const {isFetching,onSubscribe} = useSubscribePlan()
  return (
    <Button 
    type='button'
    onClick={onSubscribe}
    disabled={isFetching}
     variant={'default'} className='font-mono font-black bg-[#3B66E8] dark:text-white hover:bg-blue-400'>
      {
        isFetching ? 

        ( 
           <>
           <Loader2 className='animate-spin opacity-70' />
           <span>Processing...</span>
           </>
           
        ) : (
           <>
           Subscribe
           </>
        )
      }
    </Button>
  )
}

export default SubscribeButton