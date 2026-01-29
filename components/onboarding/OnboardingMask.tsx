import React from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Svg, { Defs, Mask, Rect, Circle } from 'react-native-svg';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

export const OnboardingMask = ({ layout }: { layout: { x: number; y: number; width: number; height: number } | null }) => {
  // Guard against null OR empty layout (0,0,0,0)
  if (!layout || (layout.width === 0 && layout.height === 0)) {
    return null;
  }


  
  // Adjusted radius for a cleaner look
  const r = Math.max(layout.width, layout.height) / 1.8 + 10;

  const padding = 4;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg 
        height={windowHeight} 
        width={windowWidth} 
        viewBox={`0 0 ${windowWidth} ${windowHeight}`}
      >
        <Defs>
          <Mask id="myMask">
            {/* 1. Background (White = Visible Overlay) */}
            <Rect x="0" y="0" width={windowWidth} height={windowHeight} fill="white" />
            
            {/* 2. The Hole (Black = Transparent/Cutout) */}
            <Rect 
              x={layout.x - padding} 
              y={layout.y - padding} 
              width={layout.width + (padding * 2)} 
              height={layout.height + (padding * 2)}
              rx={10} // Match the border radius of your search bar
              fill="black" 
            />
          </Mask>
        </Defs>
        {/* This Rect draws the dimmed background everywhere EXCEPT the hole */}
        <Rect
          x="0"
          y="0"
          width={windowWidth}
          height={windowHeight}
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#myMask)"
        />
      </Svg>
      
    </View>
  );
};