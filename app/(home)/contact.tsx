import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";

export default function ContactScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (!name || !email || !message) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Simulate sending message
    Alert.alert(
      "Message Sent",
      "Thank you for contacting us! We'll get back to you soon.",
      [
        {
          text: "OK",
          onPress: () => {
            setName("");
            setEmail("");
            setMessage("");
          },
        },
      ]
    );
  };

  const ContactMethod = ({
    icon,
    title,
    subtitle,
    onPress,
  }: {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center">
        <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
          <Feather name={icon as any} size={20} color="#FA541C" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800">{title}</Text>
          <Text className="text-gray-500 text-sm mt-1">{subtitle}</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Get in Touch
          </Text>
          <Text className="text-gray-600 text-lg">
            We'd love to hear from you. Send us a message and we'll respond as
            soon as possible.
          </Text>
        </View>

        {/* Contact Methods */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Contact Methods
          </Text>

          <ContactMethod
            icon="mail"
            title="Email"
            subtitle="support@lexsee.com"
            onPress={() => Linking.openURL("mailto:support@lexsee.com")}
          />

          <ContactMethod
            icon="phone"
            title="Phone"
            subtitle="+1 (555) 123-4567"
            onPress={() => Linking.openURL("tel:+15551234567")}
          />

          <ContactMethod
            icon="message-circle"
            title="Live Chat"
            subtitle="Available 24/7"
            onPress={() =>
              Alert.alert(
                "Coming Soon",
                "Live chat feature will be available soon."
              )
            }
          />
        </View>

        {/* Contact Form */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Send a Message
          </Text>

          <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Name</Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Email</Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2">Message</Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
                value={message}
                onChangeText={setMessage}
                placeholder="How can we help you?"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              onPress={handleSendMessage}
              className="bg-orange-500 rounded-lg py-4"
              style={{ backgroundColor: "#FA541C" }}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Send Message
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
