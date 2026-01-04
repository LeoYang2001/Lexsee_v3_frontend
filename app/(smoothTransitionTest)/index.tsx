import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useRouter } from "expo-router";

export default function TestIndex() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shared Transition Test</Text>

      {/* <Link href="/(smoothTransitionTest)/detail" asChild style={styles.card}> */}
      <Pressable
        onPress={() => {
          router.push("detail");
        }}
        style={styles.card}
      >
        <Animated.Image
          sharedTransitionTag="test-image"
          source={require("../../assets/images/3.png")}
          style={styles.image}
        />
      </Pressable>
      {/* </Link> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f10",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 40,
  },
  card: {
    backgroundColor: "#1a1b23",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    marginTop: 12,
  },
});
