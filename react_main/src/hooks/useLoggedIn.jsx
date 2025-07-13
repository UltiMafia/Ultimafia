import { useEffect, useState } from "react";
import axios from "axios";

export const useLoggedIn = () => {
  const [loggedIn, setLoggedIn] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/user/info");
        setLoggedIn(!!res?.data?.id);
      } catch (err) {
        console.log(err);
      }
      setLoading(false);
    };

    getUserInfo();
  }, []);

  return {
    loggedIn,
    loading,
  };
};
