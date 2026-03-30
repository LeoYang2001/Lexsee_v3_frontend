import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import { Feather } from "@expo/vector-icons";

import {
  TouchableOpacity,
  Text,
  Alert,
  View,
  Dimensions,
  ScrollView,
  Image,
} from "react-native";
import { usePathname, useRouter } from "expo-router";
import { signOut as amplifySignOut, getCurrentUser } from "aws-amplify/auth";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import appConfig from "../../app.json";
import { useEffect, useState } from "react";
import { client } from "../client";

const screenWidth = Dimensions.get("window").width;

export default function HomeLayout() {
  const router = useRouter();

  const pathname = usePathname(); // Get current path

  const profile = useSelector((state: RootState) => state.profile.data);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      // 1. Clear the token in the DB while we still have credentials
      if (profile?.id) {
        console.log("🧹 Clearing push token before sign out...");
        await (client as any).models.UserProfile.update({
          id: profile.id,
          expoPushToken: null,
        });
      }

      // 2. Trigger the global sign out (this will trigger the Hub/handleAuthFail)
      await amplifySignOut();
    } catch (error) {
      Alert.alert("Sign Out Error", (error as Error).message);
      // If DB update fails, we should probably still sign out to not trap the user
      await amplifySignOut();
    }
  };

  const aiSetting = useSelector((state: RootState) => state.aiSettings);
  const activeModel = aiSetting.activeModel;

  const tabs = [
    {
      name: "Home",
      pathname: "/",
      icon: (
        <Feather
          name="home"
          size={20}
          color="#9CA3AF"
          style={{ marginRight: 16 }}
        />
      ),
      router: "/(home)",
    },
    {
      name: "Profile",
      pathname: "/drawer/profile",
      icon: (
        <Feather
          name="user"
          size={20}
          color="#9CA3AF"
          style={{ marginRight: 16 }}
        />
      ),
      router: "/(home)/drawer/profile",
    },
    {
      name: "Daily Lexsee",
      pathname: "/drawer/dailyLexsee",
      icon: (
        <Feather
          name="calendar"
          size={20}
          color="#9CA3AF"
          style={{ marginRight: 16 }}
        />
      ),
      router: "/(home)/drawer/dailyLexsee",
    },
    {
      name: "Learning Science",
      pathname: "/drawer/info",
      icon: (
        <Feather
          name="book-open"
          size={20}
          color="#9CA3AF"
          style={{ marginRight: 16 }}
        />
      ),
      router: "/(home)/drawer/info",
    },
    {
      name: "Contact Us",
      pathname: "/drawer/contact",
      icon: (
        <Feather
          name="phone"
          size={20}
          color="#9CA3AF"
          style={{ marginRight: 16 }}
        />
      ),
      router: "/(home)/drawer/contact",
    },
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          drawerPosition: "right",
          headerShown: false,
          drawerStyle: {
            backgroundColor: "#1a1b23",
            width: screenWidth * 0.6,
            borderLeftWidth: 1,
            borderLeftColor: "#2a2b35",
          },
          drawerActiveTintColor: "#E44814",
          drawerInactiveTintColor: "#9CA3AF",
          drawerActiveBackgroundColor: "#E44814",
          drawerInactiveBackgroundColor: "transparent",
        }}
        drawerContent={(props) => (
          <View style={{ flex: 1, backgroundColor: "#191d24" }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingTop: 68 }}
              showsVerticalScrollIndicator={false}
            >
              {/* User Email Section */}
              <View
                className="flex relative justify-center items-center my-3 "
                style={{ height: 44 }}
              >
                <View
                  style={{
                    opacity: 0.03,
                  }}
                  className=" absolute w-full h-full z-10 bg-white "
                />

                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 14,
                    opacity: 0.7,
                  }}
                  className=" font-semibold"
                >
                  {profile?.displayName}
                </Text>
              </View>

              {/* Home */}

              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.pathname}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    borderBottomWidth: 1,
                    borderBottomColor: "#2a2b35",
                    backgroundColor:
                      pathname === tab.pathname ? "#2a2b35" : "transparent",
                  }}
                  onPress={() => router.push(tab.pathname)}
                >
                  {tab.icon}
                  <Text style={{ color: "#fff", fontSize: 14, opacity: 0.9 }}>
                    {tab.name}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Sign Out Button */}
              <TouchableOpacity
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  borderBottomWidth: 1,
                  borderBottomColor: "#2a2b35",
                }}
                onPress={handleSignOut}
              >
                <Feather
                  name="log-out"
                  size={20}
                  color="#9CA3AF"
                  style={{ marginRight: 16 }}
                />
                <Text style={{ color: "#fff", fontSize: 14, opacity: 0.9 }}>
                  Sign Out
                </Text>
              </TouchableOpacity>

              {/* Spacer to push Footer to bottom */}
              <View style={{ flex: 1 }} />

              {activeModel === "openai" ? (
                <View className=" w-full py-1 flex justify-center flex-row gap-3 items-center  ">
                  <Text
                    style={{
                      color: "#0ea982",
                      fontSize: 12,
                      opacity: 0.7,
                    }}
                    className=" font-semibold opacity-30 "
                  >
                    powered by {activeModel}
                  </Text>
                  <Image
                    source={require("../../assets/aiModels/openai.png")}
                    style={{ width: 22, height: 22, marginTop: 0 }}
                  />
                </View>
              ) : (
                <View className=" w-full py-1 flex justify-center flex-row gap-3 items-center  ">
                  <Text
                    style={{
                      color: "#536dfe",
                      fontSize: 12,
                      opacity: 0.7,
                    }}
                    className=" font-semibold opacity-30 "
                  >
                    powered by {activeModel}
                  </Text>
                  <Image
                    source={require("../../assets/aiModels/deepseek.png")}
                    style={{ width: 22, height: 22, marginTop: 0 }}
                  />
                </View>
              )}

              {/* Footer */}
              <View
                className=" relative flex justify-center items-center"
                style={{
                  width: "100%",
                  borderTopWidth: 1,
                  borderTopColor: "#2a2b35",
                  height: 28,
                }}
              >
                <View
                  className=" absolute w-full h-full z-10  "
                  style={{
                    opacity: 0.03,
                    backgroundColor: "#FFFFFF",
                  }}
                />
                <View className=" relative flex justify-center items-center">
                  <Text
                    style={{
                      color: "#6B7280",
                      fontSize: 12,
                      opacity: 0.6,
                    }}
                  >
                    LexSee Version {appConfig.expo.version}
                  </Text>
                  <View className=" absolute top-2">
                    <Image
                      source={require("../../assets/lexsee_logo_notext.png")}
                      style={{ width: 16, height: 16 }}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerItemStyle: { display: "none" },
            title: "LexSee",
          }}
        />
        <Drawer.Screen
          name="drawer/profile"
          options={{
            drawerItemStyle: { display: "none" },
            title: "Profile Settings",
          }}
        />
        <Drawer.Screen
          name="drawer/dailyLexsee"
          options={{
            drawerItemStyle: { display: "none" },
            title: "Daily Lexsee",
          }}
        />
        <Drawer.Screen
          name="drawer/contact"
          options={{
            drawerItemStyle: { display: "none" },
            title: "Contact",
          }}
        />
        <Drawer.Screen
          name="drawer/info"
          options={{
            popToTopOnBlur: true,
            drawerItemStyle: { display: "none" },
            title: "App Information",
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
