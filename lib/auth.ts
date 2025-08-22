import { Alert } from "react-native";
import { signOut as amplifySignOut } from "aws-amplify/auth";

export async function signOut() {
  try {
    await amplifySignOut();
  } catch (error) {
    Alert.alert("Sign Out Error", (error as Error).message);
  }
}
