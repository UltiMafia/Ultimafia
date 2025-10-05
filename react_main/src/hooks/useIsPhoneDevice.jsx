import { useMediaQuery, useTheme } from "@mui/material";

export const useIsPhoneDevice = () => {
  const theme = useTheme();
  const isPhoneDevice = useMediaQuery(theme.breakpoints.down('md'));

  return isPhoneDevice;
};
