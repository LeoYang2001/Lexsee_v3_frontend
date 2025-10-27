import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkOpenAIConnection } from "../store/slices/ifChinaSlice";
import { RootState } from "../store";

export const useCheckChina = () => {
  const dispatch = useDispatch();

  const ifChina = useSelector((state: RootState) => state.ifChina.ifChina);
  const isLoading = useSelector((state: RootState) => state.ifChina.isLoading);

  useEffect(() => {
    // Check connection when component mounts
    console.log("🚀 Initializing China check on app mount...");
    dispatch(checkOpenAIConnection() as any);
  }, []); // Empty dependency array - runs once on mount

  return { ifChina, isLoading };
};
