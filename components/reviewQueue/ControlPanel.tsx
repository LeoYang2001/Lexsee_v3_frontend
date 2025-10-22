import { View, Text, TouchableOpacity } from "react-native";
import React from "react";

interface ControlPanelProp {
  handleHintPressed: () => void;
  familiarityLevel: string;
}

const ControlPanel = ({
  handleHintPressed,
  familiarityLevel,
}: ControlPanelProp) => {
  return (
    <View className="flex-row justify-between items-center my-6">
      {/* No Button */}
      <TouchableOpacity
        // onPress={handlePrevious}
        style={{
          height: 44,
          borderRadius: 9,
          backgroundColor: "#4D4D4D",
          width: 104,
        }}
        className="flex-row items-center   justify-center"
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "400",
            color: "white",
          }}
        >
          NO
        </Text>
      </TouchableOpacity>
      {familiarityLevel !== "poor" ? (
        <TouchableOpacity
          onPress={handleHintPressed}
          style={{
            height: 44,
            borderRadius: 9,
            backgroundColor: "transparent",
            width: 104,
          }}
          className="flex-row items-center   justify-center"
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "400",
              color: "white",
              opacity: 0.7,
            }}
          >
            Hint
          </Text>
        </TouchableOpacity>
      ) : (
        <View className=" w-1 opacity-0" />
      )}

      {/* Yes Button */}
      <TouchableOpacity
        // onPress={handlePrevious}
        style={{
          height: 44,
          borderRadius: 9,
          backgroundColor: "#FA541C",
          width: 104,
        }}
        className="flex-row items-center   justify-center"
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "400",
            color: "white",
          }}
        >
          YES
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ControlPanel;
