import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import { Feather } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import ThemeToggleButton from "../../components/home/ThemeToggleButton";

import { TouchableOpacity, Text, Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { signOut as amplifySignOut } from "aws-amplify/auth";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { setIfChina } from "../../store/slices/ifChinaSlice";

export default function HomeLayout() {
  const router = useRouter();

  const dispatch = useDispatch();

  const ifChina = useSelector((state: RootState) => state.ifChina.ifChina);

  const handleSignOut = async () => {
    try {
      await amplifySignOut();
      router.replace("/(auth)/sign-in");
    } catch (error) {
      Alert.alert("Sign Out Error", (error as Error).message);
    }
  };

  // Toggle ifChina state for testing
  const handleToggleIfChina = () => {
    dispatch(setIfChina(!ifChina));
    Alert.alert(
      "Location Status Changed",
      `Testing mode: User is now ${!ifChina ? "🇨🇳 in China" : "🌍 outside China"}`
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          drawerPosition: "right",
          headerShown: false,
          drawerStyle: {
            backgroundColor: "#1a1b23", // Dark background
            width: 300, // Slightly wider
            borderLeftWidth: 1,
            borderLeftColor: "#2a2b35",
          },
          drawerActiveTintColor: "#E44814", // Orange accent
          drawerInactiveTintColor: "#9CA3AF", // Light gray
          drawerActiveBackgroundColor: "#E44814", // Orange background for active
          drawerInactiveBackgroundColor: "transparent",
        }}
        drawerContent={(props) => (
          <DrawerContentScrollView
            {...props}
            style={{ backgroundColor: "#191d24" }}
            contentContainerStyle={{ paddingTop: 48 }}
          >
            {/* Header Section */}
            <View className=" p-6">
              <Text
                style={{
                  color: "#9CA3AF",
                  fontSize: 14,
                  opacity: 0.8,
                }}
              >
                {/* placeholder for user email */}
                {"User Email" /* Replace with actual user email */}
              </Text>
            </View>

            {/* Navigation Items */}
            <View style={{ marginBottom: 20 }}>
              <DrawerItemList {...props} />
            </View>

            {/* Theme Toggle Section */}
            <View
              style={{
                paddingVertical: 16,
                borderTopWidth: 1,
                borderTopColor: "#2a2b35",
                borderBottomWidth: 1,
                borderBottomColor: "#2a2b35",
                marginBottom: 20,
              }}
            >
              <ThemeToggleButton />
            </View>

            {/* Sign Out Button */}
            <View
              style={{
                paddingHorizontal: 20,
                marginTop: "auto",
                paddingBottom: 30,
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: "#DC2626", // Red background
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  shadowColor: "#DC2626",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={handleSignOut}
                activeOpacity={0.8}
              >
                <Feather
                  name="log-out"
                  size={18}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: "white",
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>

            {/* A toggle button to switch ifChina state for testing purposes. */}

            {/* Location Toggle Button for Testing */}
            <View
              style={{
                paddingHorizontal: 20,
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: ifChina ? "#DC2626" : "#059669", // Red if China, green if not
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  shadowColor: ifChina ? "#DC2626" : "#059669",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={handleToggleIfChina}
                activeOpacity={0.8}
              >
                <Feather
                  name={ifChina ? "map-pin" : "globe"}
                  size={18}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: "white",
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  {ifChina ? "🇨🇳 In China (Test)" : "🌍 Outside China (Test)"}
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  color: "#9CA3AF",
                  fontSize: 11,
                  marginTop: 8,
                  opacity: 0.6,
                  textAlign: "center",
                }}
              >
                Tap to toggle location for testing
              </Text>
            </View>
            {/* Footer */}
            <View
              style={{
                paddingBottom: 20,
                alignItems: "center",
                backgroundColor: "#26282f",
              }}
              className="border border-red-500 w-full"
            >
              <Text
                style={{
                  color: "#6B7280",
                  fontSize: 12,
                  opacity: 0.6,
                }}
              >
                LexSee Version 3.0
              </Text>
            </View>
          </DrawerContentScrollView>
        )}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: "Home",
            title: "LexSee",
            drawerIcon: ({ color, size }) => (
              <Feather name="home" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            drawerLabel: "Settings",
            title: "Settings",
            drawerIcon: ({ color, size }) => (
              <Feather name="settings" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="contact"
          options={{
            drawerLabel: "Contact",
            title: "Contact",
            drawerIcon: ({ color, size }) => (
              <Feather name="phone" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="info"
          options={{
            drawerLabel: "App Info",
            title: "App Information",
            drawerIcon: ({ color, size }) => (
              <Feather name="info" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            drawerLabel: "Profile",
            title: "Profile",
            drawerIcon: ({ color, size }) => (
              <Feather name="user" size={size} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
