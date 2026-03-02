import { View, Text, Dimensions, StyleSheet, Alert } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import LottieView from "lottie-react-native";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import Logo from "../../components/common/Logo";
import FormStepOne from "../../components/provision/FormStepOne";
import FormStepTwo from "../../components/provision/FormStepTwo";
import { client } from "../client";
import { useAppSelector } from "../../store/hooks";
import { LANGUAGES } from "../../lib/profileData";
import { FormStepThree } from "../../components/provision/FormStepThree";

const { width: windowWidth } = Dimensions.get("window");

const AnimatedLottie = Animated.createAnimatedComponent(LottieView);

export interface ProfileData {
  displayName: string;
  nativeLanguage: string;
  timezone: string;
  growthStyle: "STABILITY" | "EXAM_READY" | "BALANCED";
}

const onboarding = () => {
  //step 1: ask for full name
  //step 2: ask for native language & timezone (auto detect)
  //step 3: learning style: fluency, exam ready, balanced
  //step 4: optional: placeholder for now, can be added later
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // get user profile from redux
  const profileFromRedux = useAppSelector((state) => state.profile.data);

  const [profileData, setProfileData] = useState({
    displayName: profileFromRedux?.username || "",
    nativeLanguage: profileFromRedux?.nativeLanguage || "",
    timezone: profileFromRedux?.timezone || "",
    growthStyle: profileFromRedux?.growthStyle || "STABILITY",
  });

  // A generic update function to pass to children
  const updateProfile = (newData: Partial<ProfileData>) => {
    setProfileData((prev) => ({ ...prev, ...newData }));
  };
  const handleStepSubmit = async (nextData: Partial<ProfileData>) => {
    setIsLoading(true);
    try {
      // 1. Update local state immediately for UI responsiveness
      updateProfile(nextData);
      if (!profileFromRedux?.userId) {
        throw new Error("User ID is missing in profile data.");
      }
      // 2. Partial Update to AWS (Using the current userId)
      // In Amplify Gen 2, .create() works for step 1, .update() for steps 2-4
      if (step === 1) {
        await (client as any).models.UserProfile.update({
          id: profileFromRedux.id,
          displayName: nextData.displayName!,
        });
      } else if (step === 2) {
        await (client as any).models.UserProfile.update({
          id: profileFromRedux.id,
          ...nextData,
        });
      }

      // 3. Only move to next UI step if DB call succeeds
      onNextStep();
    } catch (err) {
      Alert.alert("Error", "We couldn't save your progress. Please try again.");
      console.error(
        "Error updating profile during onboarding:",
        JSON.stringify(err),
      );
    } finally {
      setIsLoading(false);
    }
  };
  // 3. Move the ScrollView whenever the step changes
  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      x: (step - 1) * windowWidth,
      animated: true,
    });
  }, [step]);

  const onNextStep = () => {
    if (step < 4) {
      console.log("step", step);
      setStep(step + 1);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* INDICATOR  */}
      <TopIndicator step={step} />
      <BackgroundAnim step={step} profileData={profileData} />
      {/* Below is where the onboarding form will go.
      we want to use modal from the bottom to pop up the form, first form will be just asking for name  */}
      <GestureHandlerRootView className="mt-[30%]">
        <ScrollView
          horizontal
          ref={scrollViewRef}
          scrollEnabled={false}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          className=" flex-1 "
        >
          {/* form 1: ask for full name */}
          <Animated.View
            entering={FadeIn}
            style={{ width: windowWidth }}
            className="  h-full "
          >
            <FormStepOne
              step={step}
              onNext={handleStepSubmit}
              isLoading={isLoading}
            />
          </Animated.View>
          <Animated.View
            entering={FadeIn}
            style={{ width: windowWidth }}
            className="  h-full "
          >
            <FormStepTwo
              step={step}
              onNext={handleStepSubmit}
              onBack={() => setStep(step - 1)}
              isLoading={isLoading}
            />
          </Animated.View>
          <Animated.View
            entering={FadeIn}
            style={{ width: windowWidth }}
            className="  h-full "
          >
            <FormStepThree />
          </Animated.View>
          <View style={{ width: windowWidth }} />
        </ScrollView>
      </GestureHandlerRootView>
      <View className=" h-[10%] w-full justify-center items-center ">
        <Logo size={60} />
      </View>
    </View>
  );
};

const TopIndicator = ({ step }: { step: number }) => {
  return (
    <View className="h-[15%] w-full justify-center px-6">
      <View className="flex-row gap-2">
        {[1, 2, 3, 4].map((segmentIndex) => (
          <ProgressSegment
            key={segmentIndex}
            isActive={step >= segmentIndex}
            step={step}
            segmentIndex={segmentIndex}
          />
        ))}
      </View>
    </View>
  );
};

const ProgressSegment = ({
  isActive,
  step,
  segmentIndex,
}: {
  isActive: boolean;
  step: number;
  segmentIndex: number;
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (step >= segmentIndex) {
      progress.value = withTiming(1, { duration: 400 });
    } else {
      progress.value = withTiming(0, { duration: 400 });
    }
  }, [step, segmentIndex]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  return (
    <View style={styles.segmentTrack}>
      <Animated.View style={[styles.segmentFill, animatedStyle]} />
    </View>
  );
};

const BackgroundAnim = ({
  step,
  profileData,
}: {
  step: number;
  profileData: any;
}) => {
  return (
    <View
      style={{
        zIndex: -1,
      }}
      className=" w-full justify-start h-full absolute "
    >
      <View className="relative  flex justify-center items-center top-[20%]">
        {/* The Central Mesh */}
        <AnimatedLottie
          sharedTransitionTag="backgroundMesh"
          source={require("../../assets/lottieAnims/mesh-gradient.json")}
          autoPlay
          loop
          resizeMode="cover"
          style={{ width: 170, height: 170 }}
        />

        {/* STEP 2: Name Badge appears */}
        {/* {step >= 2 && profileData.displayName && (
          <OrbitalBadge
            text={profileData.displayName}
            radius={95}
            duration={9000}
          />
        )} */}

        {/* STEP 3: Language & Timezone appear */}
        {/* {step >= 3 && (
          <>
            <OrbitalBadge
              text={
                LANGUAGES.find((l) => l.name === profileData.nativeLanguage)
                  ?.flag || "🌐"
              }
              radius={45}
              duration={12000}
            />
            <OrbitalBadge text="🌍" radius={65} duration={6000} />
          </>
        )} */}
      </View>
    </View>
  );
};

const OrbitalBadge = ({
  text,
  radius,
  duration,
}: {
  text: string;
  radius: number;
  duration: number;
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Infinite linear rotation from 0 to 2π (360 degrees)
    rotation.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: Math.cos(rotation.value) * radius },
        { translateY: Math.sin(rotation.value) * radius },
      ],
    };
  });

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={[
        animatedStyle,
        {
          position: "absolute",
          backgroundColor: "rgba(255, 255, 255, 0.12)",
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.2)",
        },
      ]}
    >
      <Text className="text-white text-xs font-bold shadow-sm">{text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  segmentTrack: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#2A2B2F",
    overflow: "hidden",
  },
  segmentFill: {
    height: "100%",
    backgroundColor: "#FA541C",
    borderRadius: 999,
  },
});

export default onboarding;
