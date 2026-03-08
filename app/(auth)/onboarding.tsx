import { View, Text, Dimensions, StyleSheet, Alert } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  BounceIn,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
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
import FormStepFour from "../../components/provision/FormStepFour";
import { GrowthStyle } from "../../store/slices/profileSlice";

const { width: windowWidth } = Dimensions.get("window");

const AnimatedLottie = Animated.createAnimatedComponent(LottieView);

export interface StudyConfig {
  dailyPacing: number;
  masteryIntervalDays: number;
  newwordNotificationsEnabled: boolean;
  overallGoal?: number;
  daysForGoal?: number;
}

export interface ProfileData {
  displayName: string;
  nativeLanguage: string;
  timezone: string;
  growthStyle: GrowthStyle;
  dailyPacing?: number;
  masteryIntervalDays?: number;
  newwordNotificationsEnabled?: boolean;
  overallGoal?: number;
  daysForGoal?: number;
}

const onboarding = () => {
  //step 1: ask for full name
  //step 2: ask for native language & timezone (auto detect)
  //step 3: learning style: fluency, exam ready, balanced
  //step 4: optional: placeholder for now, can be added later
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [ifOnboardingComplete, setIfOnboardingComplete] = useState(false);
  const router = useRouter();

  // get user profile from redux
  const profileFromRedux = useAppSelector((state) => state.profile.data);

  const [profileData, setProfileData] = useState({
    displayName: profileFromRedux?.username || "",
    nativeLanguage: profileFromRedux?.nativeLanguage || "",
    timezone: profileFromRedux?.timezone || "",
    growthStyle: profileFromRedux?.growthStyle || "FLUENCY",
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
      } else if (step === 3) {
        let masteryIntervalDays: number;
        let dailyPacing: number;
        let newwordNotificationsEnabled: boolean;
        // growthStyle will determine dailyPacing and masteryIntervalDays and newwordNotificationsEnabled
        if (nextData.growthStyle === "FLUENCY") {
          masteryIntervalDays = 180;
          dailyPacing = 3;
          newwordNotificationsEnabled = false;
        } else if (nextData.growthStyle === "BALANCED") {
          masteryIntervalDays = 120;
          dailyPacing = 10;
          newwordNotificationsEnabled = false;
        } else {
          masteryIntervalDays = 60;
          dailyPacing = 20;
          newwordNotificationsEnabled = true;
        }
        await (client as any).models.UserProfile.update({
          id: profileFromRedux.id,
          growthStyle: nextData.growthStyle!,
          masteryIntervalDays,
          dailyPacing,
          newwordNotificationsEnabled,
        });
      } else if (step === 4) {
        // Final step: could handle any final data saving if needed
        if (!nextData || Object.keys(nextData).length === 0) {
          // Prompt confirmation dialog for skipping configuration
          return new Promise<void>((resolve) => {
            Alert.alert(
              "Skip Configuration?",
              "You can always set up your study plan later in Settings. Continue without configuring now?",
              [
                {
                  text: "Go Back",
                  style: "cancel",
                  onPress: () => {
                    setIsLoading(false);
                    resolve();
                  },
                },
                {
                  text: "Skip for Now",
                  style: "default",
                  onPress: async () => {
                    try {
                      // Mark onboarding as complete
                      await (client as any).models.UserProfile.update({
                        id: profileFromRedux.id,
                        onboardingComplete: true,
                      });
                      onNextStep();
                      resolve();
                    } catch (error) {
                      console.error("Error completing onboarding:", error);
                      Alert.alert(
                        "Error",
                        "Failed to complete onboarding. Please try again.",
                      );
                      resolve();
                    }
                  },
                },
              ],
            );
          });
        } else {
          // Update profile with study configuration
          const {
            masteryIntervalDays,
            dailyPacing,
            newwordNotificationsEnabled,
            overallGoal,
            daysForGoal,
          } = nextData as StudyConfig;
          await (client as any).models.UserProfile.update({
            id: profileFromRedux.id,
            masteryIntervalDays,
            dailyPacing,
            newwordNotificationsEnabled,
            overallGoal,
            daysForGoal,
            onboardingComplete: true,
          });
        }
      }

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

  // 4. Navigate to home after onboarding completes
  useEffect(() => {
    if (ifOnboardingComplete) {
      const timer = setTimeout(() => {
        router.dismissAll();
        router.push("/(home)");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [ifOnboardingComplete, router]);

  const onNextStep = () => {
    if (step < 4) {
      console.log("step", step);
      setStep(step + 1);
    } else {
      console.log("Onboarding complete!");
      setIfOnboardingComplete(true);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* INDICATOR  */}
      <TopIndicator step={step} />
      <BackgroundAnim step={step} profileData={profileData} />
      {/* Below is where the onboarding form will go.
      we want to use modal from the bottom to pop up the form, first form will be just asking for name  */}
      {!ifOnboardingComplete ? (
        <GestureHandlerRootView className="mt-[20%]">
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
                profileId={profileFromRedux?.id}
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
              className="  h-full overflow-hidden "
            >
              <FormStepThree
                step={step}
                onNext={handleStepSubmit}
                onBack={() => setStep(step - 1)}
                isLoading={isLoading}
              />
            </Animated.View>
            <Animated.View
              entering={FadeIn}
              style={{ width: windowWidth }}
              className=" h-full overflow-hidden "
            >
              <FormStepFour
                onNext={handleStepSubmit}
                step={step}
                growthStyle={profileData.growthStyle}
                onBack={() => setStep(step - 1)}
              />
            </Animated.View>
            <View style={{ width: windowWidth }} />
          </ScrollView>
        </GestureHandlerRootView>
      ) : (
        <View
          style={{ flex: 1 }}
          className=" justify-center items-center px-6 "
        >
          <Animated.View
            entering={BounceIn.delay(300).springify()}
            className="justify-center items-center mb-8"
          >
            {/* <LottieView
              source={require("../../assets/lottieAnims/checkMark.json")}
              autoPlay
              loop={false}
              resizeMode="cover"
              style={{ width: 70, height: 70 }}
            /> */}
          </Animated.View>

          <Animated.Text
            entering={FadeIn.delay(800)}
            className="text-3xl font-bold text-white text-center mb-3"
          >
            You're All Set!
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(1100)}
            className="text-lg text-gray-400 text-center leading-6"
          >
            Your personalized learning journey starts now.
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(1400)}
            className="text-sm text-gray-500 text-center mt-8"
          >
            Redirecting to home...
          </Animated.Text>
        </View>
      )}
      <View className=" h-[6%] w-full justify-center items-center ">
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
      {/* The Orbital Badges and Central Mesh */}
      <View className="  flex justify-center items-center absolute w-full top-[15%]">
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
        {step >= 2 && profileData.displayName && (
          <OrbitalBadge
            text={profileData.displayName}
            radius={95}
            duration={9000}
          />
        )}

        {/* STEP 3: Language & Timezone appear */}
        {step >= 3 && (
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
        )}

        {/* STEP 4: Growth style appears */}
        {step >= 4 && profileData.growthStyle && (
          <OrbitalBadge
            text={
              profileData.growthStyle === "FLUENCY"
                ? "🧱 Fluency"
                : profileData.growthStyle === "BALANCED"
                  ? "⚖️ Balanced"
                  : profileData.growthStyle === "EXAM_READY"
                    ? "🚀 Exam Ready"
                    : profileData.growthStyle
            }
            radius={115}
            duration={10000}
          />
        )}
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
