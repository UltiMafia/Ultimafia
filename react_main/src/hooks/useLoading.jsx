import { useEffect, useState } from "react";

export const useLoading = ({ minLoadingTime } = {}) => {
  const [value, setValue] = useState(true);
  const [isFakeLoading, setIsFakeLoading] = useState(false);

  useEffect(() => {
    let timeout;
    if (value) {
      setIsFakeLoading(true);
      setTimeout(() => setIsFakeLoading(false), minLoadingTime ?? 200);
    }

    return () => timeout && clearTimeout(timeout);
  }, [value]);

  const setLoading = (newValue) => {
    setValue(newValue);
  };

  return {
    loading: value || isFakeLoading,
    setLoading,
  };
};
