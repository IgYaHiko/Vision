// utils/styleGuideAdapter.ts
export interface AIStyleGuide {
  theme: string;
  description: string;
  colorSections: {
    primary: { 
      title: string; 
      swatches: Array<{ name: string; haxColor: string; description?: string }> 
    };
    secondary: { 
      title: string; 
      swatches: Array<{ name: string; haxColor: string; description?: string }> 
    };
    uiComponents: { 
      title: string; 
      swatches: Array<{ name: string; haxColor: string; description?: string }> 
    };
    utility: { 
      title: string; 
      swatches: Array<{ name: string; haxColor: string; description?: string }> 
    };
    status: { 
      title: string; 
      swatches: Array<{ name: string; haxColor: string; description?: string }> 
    };
  };
  typographySection: Array<{
    title: string;
    style: Array<{
      name: string;
      fontFamily: string;
      fontWeight: string;
      lineHeight: string;
      letterSpacing: string;
      description?: string;
    }>;
  }>;
}

export interface ReduxStyleGuide {
  theme: string;
  description: string;
  colorSection: [
    {
      title: 'Primary Color' | 'Secondary & Accent Color' | 'UI Component Color' | 'Utility & Form Color' | 'Status & Feedback Color';
      swatchs: Array<{ name: string; hexColor: string; description?: string }>
    },
    {
      title: 'Primary Color' | 'Secondary & Accent Color' | 'UI Component Color' | 'Utility & Form Color' | 'Status & Feedback Color';
      swatchs: Array<{ name: string; hexColor: string; description?: string }>
    },
    {
      title: 'Primary Color' | 'Secondary & Accent Color' | 'UI Component Color' | 'Utility & Form Color' | 'Status & Feedback Color';
      swatchs: Array<{ name: string; hexColor: string; description?: string }>
    },
    {
      title: 'Primary Color' | 'Secondary & Accent Color' | 'UI Component Color' | 'Utility & Form Color' | 'Status & Feedback Color';
      swatchs: Array<{ name: string; hexColor: string; description?: string }>
    }
  ];
  typographySection: [
    {
      title: string;
      style: Array<{
        name: string;
        fontFamily: string;
        fontSize: string;
        fontWeight: string;
        lineWeight: string;
        letterSpacing: string;
        description: string;
      }>
    },
    {
      title: string;
      style: Array<{
        name: string;
        fontFamily: string;
        fontSize: string;
        fontWeight: string;
        lineWeight: string;
        letterSpacing: string;
        description: string;
      }>
    },
    {
      title: string;
      style: Array<{
        name: string;
        fontFamily: string;
        fontSize: string;
        fontWeight: string;
        lineWeight: string;
        letterSpacing: string;
        description: string;
      }>
    }
  ];
}

export function adaptAIToRedux(aiData: AIStyleGuide): ReduxStyleGuide {
  // Get all color sections
  const colorSections = [
    {
      title: 'Primary Color' as const,
      swatchs: aiData.colorSections.primary.swatches.map(sw => ({
        name: sw.name,
        hexColor: sw.haxColor,
        description: sw.description || ''
      }))
    },
    {
      title: 'Secondary & Accent Color' as const,
      swatchs: aiData.colorSections.secondary.swatches.map(sw => ({
        name: sw.name,
        hexColor: sw.haxColor,
        description: sw.description || ''
      }))
    },
    {
      title: 'UI Component Color' as const,
      swatchs: aiData.colorSections.uiComponents.swatches.map(sw => ({
        name: sw.name,
        hexColor: sw.haxColor,
        description: sw.description || ''
      }))
    },
    {
      title: 'Utility & Form Color' as const,
      swatchs: aiData.colorSections.utility.swatches.map(sw => ({
        name: sw.name,
        hexColor: sw.haxColor,
        description: sw.description || ''
      }))
    }
    // Note: Skipping 'status' section to match Redux expectation of exactly 4 sections
  ];

  // Take first 3 typography sections (Redux expects exactly 3)
  const typographySections = aiData.typographySection.slice(0, 3).map(section => ({
    title: section.title,
    style: section.style.map(style => ({
      name: style.name,
      fontFamily: style.fontFamily,
      fontSize: '16px', // Default value since AI doesn't provide it
      fontWeight: style.fontWeight,
      lineWeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      description: style.description || ''
    }))
  }));

  // Ensure we have exactly 3 typography sections
  while (typographySections.length < 3) {
    typographySections.push({
      title: `Typography Section ${typographySections.length + 1}`,
      style: []
    });
  }

  return {
    theme: aiData.theme,
    description: aiData.description,
    colorSection: [
      colorSections[0],
      colorSections[1],
      colorSections[2],
      colorSections[3]
    ] as ReduxStyleGuide['colorSection'],
    typographySection: [
      typographySections[0],
      typographySections[1],
      typographySections[2]
    ] as ReduxStyleGuide['typographySection']
  };
}