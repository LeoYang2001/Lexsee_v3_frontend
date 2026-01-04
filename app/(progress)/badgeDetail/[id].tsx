import { router, useLocalSearchParams } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";
import { useIsFocused } from "@react-navigation/native";

function BadgeDetailContent({ id }: { id: string | string[] }) {
  return (
    <View
      className="bg-black"
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ position: "absolute", top: 60, left: 20 }}
      >
        <Text className="text-white text-lg">← Back</Text>
      </TouchableOpacity>

      <Animated.Image
        style={{ width: 200, height: 200 }}
        source={require("../../../assets/badges/badge-unachieved.png")}
        sharedTransitionTag={`badge-image-${id}`}
      />

      <Text className="text-white text-lg mt-6">Badge ID: {id}</Text>
    </View>
  );
}

export default function BadgeDetailPage() {
  const { id } = useLocalSearchParams();
  const isFocused = useIsFocused();

  // Unmount content when screen is blurred
  if (!isFocused) {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }

  return <BadgeDetailContent id={id as string} />;
}
