import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";


export interface ColorSwatchs {
     name: string;
     hexColor: string;
     description?: string;
}
export interface ColorSection {
    title: 
    | 'Primary Color'
    | 'Secondary & Accent Color'
    | 'UI Component Color'
    | 'Utility & Form Color'
    | 'Status & Feedback Color'
  swatchs: ColorSwatchs[]
}

export interface GenerateStyleGuideRequest {
      projectId: string
}

export interface GenerateStyleGuideResponse {
      success: boolean
      message: string
      styleGuide: StyleGuide
}



export interface TypographyStyle {
     name: string;
     fontFamily: string;
     fontSize: string;
     fontWeight: string;
     lineWeight: string;
     letterSpacing: string;
     description: string;
}

export interface TypographySection {
     title: string;
     style: TypographyStyle[]
}

export interface StyleGuide {
    theme: string;
    description: string;
    colorSection: [
        ColorSection,
        ColorSection,
        ColorSection,
        ColorSection
    ];
    typographySection: [TypographySection, TypographySection, TypographySection]
}

export const StyleApi = createApi({
     reducerPath: "styleApi",
     baseQuery: fetchBaseQuery({baseUrl: "/api/generate"}),
     tagTypes: ['StyleGuide'],
     endpoints: (builder) => ({
           generateStyleGuide: builder.mutation<
            GenerateStyleGuideResponse,
            GenerateStyleGuideRequest>({
                 query: ({projectId}) => ({
                     url: '/style',
                     method: "POST",
                     headers: {
                          'Content-type' : 'application/json',
                     },
                     body: { projectId },

                }),
                invalidatesTags:  ['StyleGuide'],
            })
           
     })
})

export const { useGenerateStyleGuideMutation } = StyleApi