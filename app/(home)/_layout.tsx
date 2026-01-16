import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import { Feather } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import ThemeToggleButton from "../../components/home/ThemeToggleButton";

import { TouchableOpacity, Text, Alert, View, Dimensions, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { signOut as amplifySignOut } from "aws-amplify/auth";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { setIfChina } from "../../store/slices/ifChinaSlice";
import appConfig from "../../app.json";

const screenWidth = Dimensions.get("window").width;

export default function HomeLayout() {
  const router = useRouter();

  const dispatch = useDispatch();

  const ifChina = useSelector((state: RootState) => state.ifChina.ifChina);
  const user = useSelector((state: RootState) => state.user.user);

  const handleSignOut = async () => {
    try {
      await amplifySignOut();
      // router.replace("/(auth)/sign-in");
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
              <View className="flex relative justify-center items-center my-3 "  style={{ height:44}}>
                <View style={{
                  opacity: 0.03
                }} className=" absolute w-full h-full z-10 bg-white " />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 12,
                    opacity: 0.7
                  }}
                >
                  {user?.email || "No email available"}
                </Text>
              </View>

              {/* Home */}
              <TouchableOpacity
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  borderBottomWidth: 1,
                  borderBottomColor: "#2a2b35",
                }}
                onPress={() => router.push("/(home)")}
              >
                <Feather name="home" size={20} color="#9CA3AF" style={{ marginRight: 16 }} />
                <Text style={{ color: "#fff", fontSize: 14, opacity: 0.9 }}>Home</Text>
              </TouchableOpacity>

              {/* Guidance */}
              <TouchableOpacity
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  borderBottomWidth: 1,
                  borderBottomColor: "#2a2b35",
                }}
                onPress={() => router.push("/(home)/info")}
              >
                <Feather name="book-open" size={20} color="#9CA3AF" style={{ marginRight: 16 }} />
                <Text style={{ color: "#fff", fontSize: 14, opacity: 0.9 }}>Guidance</Text>
              </TouchableOpacity>

              {/* Contact Us */}
              <TouchableOpacity
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  borderBottomWidth: 1,
                  borderBottomColor: "#2a2b35",
                }}
                onPress={() => router.push("/(home)/contact")}
              >
                <Feather name="phone" size={20} color="#9CA3AF" style={{ marginRight: 16 }} />
                <Text style={{ color: "#fff", fontSize: 14, opacity: 0.9 }}>Contact Us</Text>
              </TouchableOpacity>

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
                <Feather name="log-out" size={20} color="#9CA3AF" style={{ marginRight: 16 }} />
                <Text style={{ color: "#fff", fontSize: 14, opacity: 0.9 }}>Sign Out</Text>
              </TouchableOpacity>

              {/* Spacer to push Footer to bottom */}
              <View style={{ flex: 1 }} />

              {/* Footer */}
              <View
              className=" relative flex justify-center items-center" 
                style={{
                  width: '100%',
                  borderTopWidth: 1,
                  borderTopColor: "#2a2b35",
                  height:28
                }}
              >
                <View className=" absolute w-full h-full z-10  " style={{
                  opacity: 0.03,
                  backgroundColor: "#FFFFFF"
                }} />
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
                    source={require('../../assets/lexsee_logo_notext.png')}
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
            drawerItemStyle: { display: 'none' },
            title: "LexSee",
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            drawerItemStyle: { display: 'none' },
            title: "Settings",
          }}
        />
        <Drawer.Screen
          name="contact"
          options={{
            drawerItemStyle: { display: 'none' },
            title: "Contact",
          }}
        />
        <Drawer.Screen
          name="info"
          options={{
            drawerItemStyle: { display: 'none' },
            title: "App Information",
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            drawerItemStyle: { display: 'none' },
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
