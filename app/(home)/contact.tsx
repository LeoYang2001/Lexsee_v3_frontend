import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/routers';
import Animated, { 
  FadeInUp, 
  FadeOutUp, 
  LinearTransition 
} from 'react-native-reanimated';
import emailjs from '@emailjs/react-native';

const ContactScreen = () => {


  // --- EMAILJS CONFIG (Replace with your keys) ---
  const SERVICE_ID = 'service_8m223te';
  const TEMPLATE_ID = 'template_2ozcmnn';
  const PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_API_KEY;

  useEffect(() => {
    if (!PUBLIC_KEY) {
      console.warn('Missing EmailJS public key (EXPO_PUBLIC_EMAILJS_API_KEY).');
      alert('Email service is not configured. Please contact support.');
      return;
    }
    emailjs.init({ publicKey: PUBLIC_KEY });
  }, [PUBLIC_KEY]);


  // 1. Unified State for Backend Integration
  const [formData, setFormData] = useState({
    category: 'suggestion',
    title: '',
    email: '',
    message: '',
  });

  // 2. UI Focus State
  const [isMessageFocused, setIsMessageFocused] = useState(false);

  const [loading, setLoading] = useState(false);

  const categories = ['suggestion', 'complaint', 'anything else'];
  const navigation = useNavigation();

  const handleDrawerToggle = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Helper to update specific fields
  const updateField = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Email Regex helper
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const emailError = formData.email.length > 0 && !isValidEmail(formData.email);

  const isFormValid = 
    formData.title.trim().length > 0 && 
    isValidEmail(formData.email) && 
    formData.message.trim().length > 0;

  // --- SUBMIT LOGIC ---
  const handleSubmit = async () => {
    if (!isFormValid) return;

    setLoading(true);
    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          title: `${formData.category.toUpperCase()}: ${formData.title}`,    
        name: formData.email,    
        message: formData.message,
        time: new Date().toLocaleString(), 
           }
      );

      Alert.alert("Success", "Your message has been sent!");
      // Reset form
      setFormData({ category: 'suggestion', title: '', email: '', message: '' });
    } catch (error) {
      console.log("EmailJS Error:", error);
      Alert.alert("Error", "Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <View className="flex-1 pt-20 bg-[#191D24]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setIsMessageFocused(false);
        }}>
          <ScrollView 
            className="flex-1 px-4"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header & Categories: Smooth Fade in/out */}
            {!isMessageFocused && (
              <Animated.View 
                entering={FadeInUp.duration(400)} 
                exiting={FadeOutUp.duration(300)}
              >
                <TouchableOpacity 
                  className="ml-auto mt-4 mb-2"
                  onPress={handleDrawerToggle}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 18 }} className="w-8 flex gap-1">
                    <View style={{ height: 2 }} className="bg-white w-full" />
                    <View style={{ height: 2 }} className="bg-white w-full" />
                  </View>
                </TouchableOpacity>

                <Text className="text-white text-3xl font-bold mb-1">Contact</Text>
                <Text className="text-gray-400 text-md mb-12">
                  Your feedback is important to us, please leave us a message and we will email you back as soon as possible.
                </Text>

                <View className="flex-row mb-8 gap-2">
                  {categories.map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => updateField('category', item)}
                      className={`px-4 py-2 rounded-md ${
                        formData.category === item ? 'bg-[#FA541C]' : 'bg-[#2A2E35]'
                      }`}
                    >
                      <Text className={`capitalize ${formData.category === item ? 'text-white' : 'text-gray-400'}`}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Form Fields: Smooth Layout Transitions */}
            <Animated.View 
              layout={LinearTransition.springify().damping(18)} 
              className="space-y-6"
            >
              {!isMessageFocused && (
                <Animated.View 
                  entering={FadeInUp.delay(100)} 
                  exiting={FadeOutUp.duration(200)}
                >
                  <View>
                    <Text className="text-gray-300 my-2">Your title</Text>
                    <TextInput
                      value={formData.title}
                      onChangeText={(val) => updateField('title', val)}
                      placeholderTextColor="#4B5563"
                      className="bg-[#2A2E35] text-white p-4 rounded-xl"
                    />
                  </View>

                  <View className="mt-4">
                    <Text className="text-gray-300 my-2">Your email</Text>
                    <TextInput
                      value={formData.email}
                      onChangeText={(val) => updateField('email', val)}
                      placeholderTextColor="#4B5563"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      className={`bg-[#2A2E35] text-white p-4 rounded-xl border ${
                        emailError ? 'border-red-500' : 'border-transparent'
                      }`}
                    />
                    {emailError && (
                      <Animated.Text 
                        entering={FadeInUp} 
                        className="text-red-500 text-xs mt-2 ml-1"
                      >
                        Please enter a valid email address
                      </Animated.Text>
                    )}
                  </View>
                </Animated.View>
              )}

              {/* Message Area: Expands when focused */}
              <View className="mt-4">
                <View className="flex-row justify-between items-center my-2">
                   <Text className="text-gray-300">Message</Text>
                   {isMessageFocused && (
                     <TouchableOpacity onPress={() => {
                       Keyboard.dismiss();
                       setIsMessageFocused(false);
                     }}>
                       <Text className="text-[#D96339] font-bold">Done</Text>
                     </TouchableOpacity>
                   )}
                </View>
                <TextInput
                  multiline
                  value={formData.message}
                  onChangeText={(val) => updateField('message', val)}
                  onFocus={() => setIsMessageFocused(true)}
                  placeholder="What do you want to tell us..."
                  placeholderTextColor="#4B5563"
                  textAlignVertical="top"
                  className={`bg-[#2A2E35] text-white p-4 rounded-xl ${
                    isMessageFocused ? 'h-80' : 'h-40'
                  }`}
                />
              </View>
            </Animated.View>

            {/* Submit Button */}
          <TouchableOpacity 
              onPress={handleSubmit}
              disabled={!isFormValid || loading}
              activeOpacity={0.8}
              className={`py-4 rounded-xl mt-auto mb-4 flex-row justify-center items-center ${isFormValid ? 'bg-[#FA541C]' : 'bg-[#2A2E35] opacity-50'}`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-center font-bold text-lg">
                  {isFormValid ? 'Send' : 'Complete Form'}
                </Text>
              )}
            </TouchableOpacity>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ContactScreen;