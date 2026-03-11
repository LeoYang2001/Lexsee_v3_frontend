import { View, Text, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { GrowthStyle } from "../../store/slices/profileSlice";
import LottieView from "lottie-react-native";
import LongtermGoal from "./LongtermGoal";
import { StudyConfig } from "../../app/(onboarding)";
import BalancedGoal from "./BalancedGoal";
import ExamreadyGoal from "./ExamreadyGoal";
import { router } from "expo-router";

const FormStepFour = ({
  onBack,
  growthStyle,
  step,
  onNext,
}: {
  onBack: () => void;
  growthStyle: string;
  step: number;
  onNext: (config: StudyConfig) => void;
}) => {
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [studyConfig, setStudyConfig] = useState<StudyConfig | null>(null);

  // Reset loading state when step changes
  useEffect(() => {
    if (step === 4) {
      setLoadingComplete(false);
      setStudyConfig(null);
    } else {
      setLoadingComplete(true);
    }
  }, [step]);

  if (step !== 4) return null;

  const handleFinalSubmit = () => {
    onNext(studyConfig!);

    setTimeout(() => {
      router.replace("/(home)");
    }, 4000);
  };

  return (
    <View className="flex-1 w-full mt-20   flex  pb-4  ">
      {!loadingComplete && (
        <FormulationLoading
          setLoadingComplete={setLoadingComplete}
          growthStyle={growthStyle}
        />
      )}
      {loadingComplete && (
        <Animated.View
          entering={FadeIn.duration(500)}
          className="flex-1 justify-center   items-center"
        >
          {growthStyle === "FLUENCY" && (
            <LongtermGoal
              studyConfig={studyConfig}
              setStudyConfig={setStudyConfig}
            />
          )}
          {growthStyle === "BALANCED" && (
            <BalancedGoal
              studyConfig={studyConfig}
              setStudyConfig={setStudyConfig}
            />
          )}
          {growthStyle === "EXAM_READY" && (
            <ExamreadyGoal
              studyConfig={studyConfig}
              setStudyConfig={setStudyConfig}
            />
          )}
        </Animated.View>
      )}
      <View className="flex-row gap-3 px-6">
        <TouchableOpacity
          className="mr-auto p-2"
          onPress={() => {
            console.log("Back pressed");
            onBack();
          }}
        >
          <Text
            style={{
              opacity: 0.3,
            }}
            className="text-white text-xl font-bold"
          >
            Previous
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="ml-auto p-2"
          onPress={() => {
            handleFinalSubmit();
          }}
        >
          {studyConfig ? (
            <Text className="text-white text-xl font-bold">Submit</Text>
          ) : (
            <Text className="text-white opacity-60 text-xl font-bold">
              Skip
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FormulationLoading = ({
  growthStyle,
  setLoadingComplete,
}: {
  growthStyle: string;
  setLoadingComplete: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const loadingPhrases: { [key in GrowthStyle]: string[] } = {
    FLUENCY: [
      "Configuring long-term stabilization intervals...",
      "Preparing a quick vocabulary estimate for you...",
      "Collecting engaging English content...",
    ],
    BALANCED: [
      "Calibrating your learning pace...",
      "Blending reinforcement with expansion...",
      "Building a steady improvement plan...",
    ],
    EXAM_READY: [
      "Structuring your exam-focused roadmap...",
      "Downloading targeted exam vocabulary...",
      "Accelerating your preparation schedule...",
    ],
  };

  const [checkMarkIndex, setCheckMarkIndex] = useState(0);

  const phrases = loadingPhrases[growthStyle as GrowthStyle] || [];

  useEffect(() => {
    const interval = setInterval(() => {
      setCheckMarkIndex((prevIndex) => {
        if (prevIndex < phrases.length - 1) {
          return prevIndex + 1;
        }
        return prevIndex;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [phrases.length]);

  useEffect(() => {
    if (checkMarkIndex === phrases.length - 1 && phrases.length > 0) {
      const timer = setTimeout(() => {
        setLoadingComplete(true);
      }, 1700);
      return () => clearTimeout(timer);
    }
  }, [checkMarkIndex, phrases.length, setLoadingComplete]);

  return (
    <Animated.View
      exiting={FadeOut}
      className="flex-1 w-full  justify-start items-center px-10  pt-12"
    >
      <Text className=" text-white text-2xl font-bold  text-center">
        Building your study plan based on your information!
      </Text>
      <View className=" flex flex-col gap-6  mt-12  p-2">
        {phrases.map((phrase, index) => (
          <PhraseAnimator
            key={index}
            phrase={phrase}
            index={index}
            checkMarkIndex={checkMarkIndex}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const PhraseAnimator = ({
  phrase,
  index,
  checkMarkIndex,
}: {
  phrase: string;
  index: number;
  checkMarkIndex: number;
}) => {
  return (
    <View className=" flex flex-row  items-center">
      <View
        style={{
          width: 24,
          height: 24,
          justifyContent: "center",
          alignItems: "center",
        }}
        className="flex  "
      >
        {checkMarkIndex < index ? (
          <View
            className=" border rounded-full"
            style={{
              width: 20,
              height: 20,
              borderWidth: 1,
              borderColor: "#FF511B",
            }}
          />
        ) : (
          <LottieView
            source={require("../../assets/lottieAnims/checkMark.json")}
            loop={false}
            autoPlay
            resizeMode="contain"
            style={{
              width: 22,
              height: 22,
            }}
          />
        )}
      </View>

      {/* // Checkmark or loading indicator can go here */}
      <Text className=" text-white  text-md opacity-70 ml-2">{phrase} </Text>
    </View>
  );
};

export default FormStepFour;
