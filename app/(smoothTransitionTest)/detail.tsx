import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Animated, {
  FadeInLeft,
  LinearTransition,
} from "react-native-reanimated";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function TestDetail() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Animated.Image
        sharedTransitionTag="test-image"
        source={require("../../assets/images/3.png")}
        style={styles.image}
      />

      <Animated.Text
        entering={FadeInLeft.duration(400).delay(600)}
        className={"text-2xl text-white"}
      >
        Detail Page
      </Animated.Text>
      <Text style={styles.desc}>If the image animated smoothly, it works!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f10",
    alignItems: "center",
    paddingTop: 60,
  },
  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    padding: 10,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 20,
    marginTop: 40,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
    marginTop: 24,
  },
  desc: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginTop: 8,
  },
});
