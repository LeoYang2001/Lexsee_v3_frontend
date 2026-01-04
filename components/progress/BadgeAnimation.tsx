import { View } from "react-native";
import React, { useEffect, useRef } from "react";
import LottieView from "lottie-react-native";

require("../../assets/lottie/Badge/images/img_0.png"); // preload image asset
require("../../assets/lottie/Badge/images/img_1.png"); // preload image asset

const BadgeAnimation = () => {
  const animationRef = useRef<LottieView | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      console.log("Lottie ref:", animationRef.current);
      animationRef.current?.play();
    }, 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <View
      style={{
        width: 420,
        height: 420,
        alignItems: "center",
        justifyContent: "center",
        aspectRatio: 1080 / 1920,
        backgroundColor: "transparent", // set temporary visible color if debugging
      }}
      className=" border border-red-50 flex justify-center items-center"
    >
      <LottieView
        source={require("../../assets/lottie/Badge/BadgeExpandSpark.json")}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(255,255,255,0.02)",
        }}
        resizeMode="contain"
        loop
        autoPlay={true} // try autoplay for debug
        imageAssetsFolder={"./images"} // try "./images" (also test "images")
        onAnimationFailure={(e) => console.warn("lottie failed:", e)}
      />
    </View>
  );
};

export default BadgeAnimation;
