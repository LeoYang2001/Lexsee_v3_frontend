import React from "react";
import { Image, ImageStyle } from "react-native";

interface LogoProps {
  size?: number;
}

function Logo({ size = 40 }: LogoProps) {
  const logoStyle: ImageStyle = {
    width: size,
    height: size,
    resizeMode: "contain",
  };

  return <Image source={require("../../assets/logo.png")} style={logoStyle} />;
}

export default Logo;
