import React from "react";
import {
  View,
  TouchableOpacity,
  StatusBar,
  Platform,
  Text,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import Logo from "../common/Logo";
import { useTheme } from "../../theme/ThemeContext";
import { AntDesign } from "@expo/vector-icons";

interface CustomHeaderProps {
  backgroundColor?: string;
  logoSize?: number;
  anchorY?: number;
  anchorDistance?: number;
}

export default function Header({
  logoSize = 60,
  anchorY,
  anchorDistance,
}: CustomHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const screenHeight = Dimensions.get("window").height;
  const theme = useTheme();

  const handleDrawerToggle = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View>
      <StatusBar translucent={false} />
      <View
        style={{
          backgroundColor: theme.background,
        }}
        className=" shadow-sm mt-16 "
      >
        <View className="flex-row items-center justify-between">
          {/* Logo on the left */}
          <View className="flex-row items-center">
            <Logo size={logoSize} />
          </View>

          {/* Drawer toggle on the right */}
          <TouchableOpacity
            onPress={handleDrawerToggle}
            className="w-10 h-10 items-center justify-center"
            activeOpacity={0.7}
          >
            <View
              style={{
                width: 18,
              }}
              className=" w-8 flex gap-1"
            >
              <View
                style={{
                  height: 2,
                }}
                className=" bg-white w-full"
              />
              <View
                style={{
                  height: 2,
                }}
                className=" bg-white w-full"
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
