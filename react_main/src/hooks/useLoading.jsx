import { useEffect, useState, useRef } from "react";

export const useLoading = ({ minLoadingTime } = {}) => {
  const [value, setValue] = useState(true);
  const [isFakeLoading, setIsFakeLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    let timeout;
    if (value) {
      setIsFakeLoading(true);
      timeout = setTimeout(() => {
        if (isMountedRef.current) {
          setIsFakeLoading(false);
        }
      }, minLoadingTime ?? 200);
    }

    return () => {
      isMountedRef.current = false;
      timeout && clearTimeout(timeout);
    };
  }, [value]);

  const setLoading = (newValue) => {
    setValue(newValue);
  };

  return {
    loading: value || isFakeLoading,
    setLoading,
  };
};
