import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { useThemeMode, useTheme } from "../../theme/ThemeContext";

export default function ThemeToggleButton() {
  const { mode, setMode } = useThemeMode();
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={{
        backgroundColor: theme.card,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginVertical: 8,
        borderWidth: 1,
        borderColor: theme.border,
      }}
      onPress={() => {
        setMode(mode === "light" ? "dark" : "light");
      }}
      activeOpacity={0.8}
    >
      <Text style={{ color: theme.text, fontWeight: "bold" }}>
        Switch to {mode === "light" ? "Dark" : "Light"} Mode
      </Text>
    </TouchableOpacity>
  );
}
