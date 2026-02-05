import { useState, useEffect } from "react";
import axios from "axios";
import { useErrorAlert } from "../components/Alerts";

export const useViolations = () => {
  const [violationDefinitions, setViolationDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    axios
      .get("/api/site/violations")
      .then((res) => {
        setViolationDefinitions(res.data);
        setLoading(false);
      })
      .catch((e) => {
        setViolationDefinitions([]);
        setError(e);
        setLoading(false);
        errorAlert(e);
      });
  }, []);

  return {
    violationDefinitions,
    loading,
    error,
  };
};
