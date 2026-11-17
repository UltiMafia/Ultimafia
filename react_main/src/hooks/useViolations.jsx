import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useErrorAlert } from "../components/Alerts";
import { LatestRequest } from "../lib/latestRequest";

export const useViolations = () => {
  const [violationDefinitions, setViolationDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const errorAlert = useErrorAlert();
  const requests = useRef(new LatestRequest());

  const reload = useCallback(() => {
    const request = requests.current.begin();
    setLoading(true);
    setError(null);
    return axios.get("/api/site/violations", { signal: request.signal })
      .then(res => { if (request.isCurrent()) setViolationDefinitions(res.data); })
      .catch(error => {
        if (!request.isCurrent()) return;
        setViolationDefinitions([]);
        setError(error);
        errorAlert(error);
      })
      .finally(() => { if (request.isCurrent()) setLoading(false); });
  }, [errorAlert]);

  useEffect(() => {
    reload();
    const reads = requests.current;
    return () => reads.invalidate();
  }, [reload]);

  return { violationDefinitions, loading, error, reload };
};
