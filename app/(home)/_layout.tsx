import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import { Feather } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import ThemeToggleButton from "../../components/home/ThemeToggleButton";

import { TouchableOpacity, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { signOut as amplifySignOut } from "aws-amplify/auth";

export default function HomeLayout() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await amplifySignOut();
      router.replace("/(auth)/sign-in");
    } catch (error) {
      Alert.alert("Sign Out Error", (error as Error).message);
    }
  };
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          drawerPosition: "right",
          headerShown: false,
          drawerStyle: {
            backgroundColor: "#f8f9fa",
            width: 280,
          },
          drawerActiveTintColor: "#FA541C",
          drawerInactiveTintColor: "#666",
          drawerLabelStyle: {
            fontSize: 16,
            fontWeight: "500",
          },
        }}
        drawerContent={(props) => (
          <DrawerContentScrollView {...props}>
            <DrawerItemList {...props} />
            <ThemeToggleButton />
            {/* add signout button here */}
            <TouchableOpacity
              style={{
                marginTop: 24,
                backgroundColor: "#FA541C",
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
              }}
              onPress={handleSignOut}
            >
              <Text
                style={{ color: "white", fontWeight: "bold", fontSize: 16 }}
              >
                Sign Out
              </Text>
            </TouchableOpacity>
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
