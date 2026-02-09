import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { RecallAccuracy } from "../../types/common/RecallAccuracy";

interface ControlPanelProp {
  handleHintPressed: () => void;
  familiarityLevel: RecallAccuracy;
  handleNextWord: (familiarityLevel: RecallAccuracy) => void;
  isLoading: boolean;
  ifShowConfirmPage: boolean;
  setIfShowConfirmPage: (value: boolean) => void;
}

const ControlPanel = ({
  handleHintPressed,
  familiarityLevel,
  handleNextWord,
  isLoading,
  ifShowConfirmPage,
  setIfShowConfirmPage
}: ControlPanelProp) => {
  if (isLoading) return null;
  if (familiarityLevel === "poor")
    return (
      <View className="flex-row justify-between items-center my-6">
        {/* Yes Button */}
        <TouchableOpacity
          style={{
            height: 44,
            borderRadius: 9,
            backgroundColor: "#FA541C",
            width: "100%",
          }}
          className="flex-row items-center   justify-center"
           onPress={() => handleNextWord(familiarityLevel)}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "400",
              color: "white",
            }}
          >
            NEXT
          </Text>
        </TouchableOpacity>
      </View>
    );
  else
    return (
      <View className="flex-row justify-between items-center my-6">
        {/* No Button */}
        <TouchableOpacity
          // onPress={handlePrevious}
          onPress={() => handleNextWord("poor")}
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
        {
          !ifShowConfirmPage && (
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
          )
        }

        {/* Yes Button */}
       {
        !ifShowConfirmPage ? (
            <TouchableOpacity
          // onPress={handlePrevious}
          // onPress={() => handleNextWord(familiarityLevel)}
          onPress={()=>{setIfShowConfirmPage(true)}}
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
        </TouchableOpacity>) : (
            <TouchableOpacity
          // onPress={handlePrevious}
          onPress={() => handleNextWord(familiarityLevel)}
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
            NEXT
          </Text>
        </TouchableOpacity>
        )
       }
      </View>
    );
};

export default ControlPanel;
