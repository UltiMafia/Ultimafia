import { useEffect, useState } from "react";

export const useLoading = ({ minLoadingTime } = {}) => {
  const [value, setValue] = useState(true);
  const [isFakeLoading, setIsFakeLoading] = useState(false);

  useEffect(() => {
    if (!value) {
      setIsFakeLoading(false);
      return;
    }

    setIsFakeLoading(true);
    const timeout = setTimeout(
      () => setIsFakeLoading(false),
      minLoadingTime ?? 200
    );

    return () => clearTimeout(timeout);
  }, [value, minLoadingTime]);

  const setLoading = (newValue) => {
    setValue(newValue);
  };

  return {
    loading: value || isFakeLoading,
    setLoading,
  };
};
