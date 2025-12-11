'use client'
import { Button } from '@/components/ui/button'
import { useSubscribePlan } from '@/hooks/use-billing';
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
     variant={'ghost'} className='font-mono font-black'>
        Subscribe
    </Button>
  )
}

export default SubscribeButton