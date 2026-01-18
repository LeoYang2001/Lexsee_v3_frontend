import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { updateAuthUser } from "../../store/slices/userSlice";
import { Feather } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(
    user?.displayName || user?.username || ""
  );

  const handleSaveProfile = () => {
    // Update profile in Redux store
    if (user) {
      dispatch(updateAuthUser({ displayName }));
      Alert.alert(
        "Profile Updated",
        "Your profile has been updated successfully!"
      );
    }
    setIsEditing(false);
  };

  const ProfileField = ({
    icon,
    label,
    value,
    editable = false,
  }: {
    icon: string;
    label: string;
    value: string;
    editable?: boolean;
  }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-center">
        <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
          <Feather name={icon as any} size={18} color="#6B7280" />
        </View>
        <View className="flex-1">
          <Text className="text-sm text-gray-500 font-medium mb-1">
            {label}
          </Text>
          {editable && isEditing ? (
            <TextInput
              className="text-lg text-gray-800 border-b border-gray-200 pb-1"
              value={label === "Display Name" ? displayName : value}
              onChangeText={
                label === "Display Name" ? setDisplayName : undefined
              }
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          ) : (
            <Text className="text-lg text-gray-800">
              {label === "Display Name" ? displayName : value}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <View className="bg-white mx-6 mt-6 rounded-xl p-6 shadow-sm border border-gray-100">
        <View className="items-center">
          <View className="w-24 h-24 bg-orange-100 rounded-full items-center justify-center mb-4">
            <Feather name="user" size={40} color="#FA541C" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-1">
            {displayName || user?.username || "User"}
          </Text>
          <Text className="text-gray-500">
            {user?.email || "user@example.com"}
          </Text>

          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            className="mt-4 px-6 py-2 rounded-lg"
            style={{ backgroundColor: isEditing ? "#10B981" : "#FA541C" }}
          >
            <Text className="text-white font-medium">
              {isEditing ? "Save Changes" : "Edit Profile"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Information */}
      <View className="px-6 py-6">
        <Text className="text-xl font-bold text-gray-800 mb-4">
          Profile Information
        </Text>

        <ProfileField
          icon="user"
          label="Display Name"
          value={displayName}
          editable={true}
        />

        <ProfileField
          icon="mail"
          label="Email"
          value={user?.email || "Not available"}
        />

        <ProfileField
          icon="key"
          label="User ID"
          value={user?.userId || "Not available"}
        />

        <ProfileField
          icon="at-sign"
          label="Username"
          value={user?.username || "Not available"}
        />

        {isEditing && (
          <View className="flex-row space-x-3 mt-6">
            <TouchableOpacity
              onPress={handleSaveProfile}
              className="flex-1 bg-green-500 rounded-lg py-4"
            >
              <Text className="text-white text-center font-semibold text-lg">
                Save Changes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsEditing(false);
                setDisplayName(user?.username || "");
              }}
              className="flex-1 bg-gray-500 rounded-lg py-4"
            >
              <Text className="text-white text-center font-semibold text-lg">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Account Actions */}
      <View className="px-6 pb-6">
        <Text className="text-xl font-bold text-gray-800 mb-4">
          Account Actions
        </Text>

        <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
              <Feather name="lock" size={18} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-800">
                Change Password
              </Text>
              <Text className="text-gray-500 text-sm">
                Update your account password
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-4">
              <Feather name="download" size={18} color="#8B5CF6" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-800">
                Export Data
              </Text>
              <Text className="text-gray-500 text-sm">
                Download your account data
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
