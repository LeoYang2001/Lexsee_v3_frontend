import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { useDispatch } from 'react-redux';
import { Alert } from 'react-native';
import { setProStatus, setPurchasing } from '../store/slices/subscriptionSlice';

export const usePurchases = () => {
  const dispatch = useDispatch();

  // 1. Manually show the Template Paywall
  const showPaywall = async () => {
    try {
      // This launches the template you built in the RC dashboard
      const result = await RevenueCatUI.presentPaywall({
        displayCloseButton: true,
      });
      console.log("Paywall result:", result);
    } catch (e) {
      console.error("Paywall error:", e);
    }
  };

  // 2. Restore Purchases (The "Legal" Button)
  const restorePurchases = async () => {
    dispatch(setPurchasing(true));
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPro = !!customerInfo.entitlements.active['pro'];
      dispatch(setProStatus(isPro));
      
      if (isPro) {
        Alert.alert("Success", "Your Pro features have been restored.");
      } else {
        Alert.alert("Notice", "No active subscription found.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      dispatch(setPurchasing(false));
    }
  };

  return { showPaywall, restorePurchases };
};