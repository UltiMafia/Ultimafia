import { useMediaQuery } from "@mui/material";

export const useIsPhoneDevice = () => {
  const isPhoneDevice = useMediaQuery("(max-width:700px)");

  return isPhoneDevice;
};
