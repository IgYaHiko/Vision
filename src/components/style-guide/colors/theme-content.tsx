// components/style-guide/colors/theme-content.tsx
'use client'

import React from 'react'
import { ColorSection } from '@/redux/api/style-guide'
import { ColorSwatchItem } from './colorswatch'

interface ThemeContentProps {
  colorGuide: ColorSection[]
}

const ThemeContent = ({ colorGuide }: ThemeContentProps) => {
  // Debug: Log what we're receiving
  console.log('🎨 ThemeContent received colorGuide:', colorGuide)
  console.log('🎨 Color sections count:', colorGuide?.length || 0)
  
  if (!colorGuide || colorGuide.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No color data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {colorGuide.map((section, index) => {
        // Safely access swatchs (note the spelling: swatchs not swatches)
        const swatchs = section.swatchs || []
        console.log(`🎨 Section ${index}: "${section.title}" has ${swatchs.length} swatchs`)
        
        return (
          <div key={index} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold capitalize">{section.title}</h3>
              <span className="text-sm text-muted-foreground">
                {swatchs.length} color{swatchs.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {swatchs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No colors in this section
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {swatchs.map((sw) => (
                  <ColorSwatchItem 
                    key={sw.name} 
                    name={sw.name} 
                    value={sw.hexColor} 
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ThemeContent