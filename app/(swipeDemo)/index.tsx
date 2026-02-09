import { View, Text, Dimensions } from 'react-native'
import React from 'react'
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';

const { width: windowWidth } = Dimensions.get("window");

const index = () => {

  const translateX = useSharedValue(0);

const animatedContainerStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }],
  flexDirection: 'row',
  width: windowWidth * 2, // Two pages wide
}));
  return (
    <GestureHandlerRootView 
    
    style={{ flex: 1 }} className=' bg-red-500'>
      <ScrollView 
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      pagingEnabled
      horizontal >
        <View className=' flex-1 justify-center items-center' style={{ width: windowWidth }}>
          <Text>Page one</Text>
  </View>

  {/* PAGE 2: Master List */}
  <View  className=' flex-1 justify-center items-center' style={{ width: windowWidth }}>
          <Text>Page two</Text>
    
  </View>
    </ScrollView>
    </GestureHandlerRootView>
  )
}

export default index