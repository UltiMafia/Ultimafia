import { useEffect, useState } from "react";

export const useNow = (refreshFrequency) => {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const interval = setInterval(
            () => setNow(Date.now()),
            refreshFrequency,
        );
        return () => clearInterval(interval);
    });
    return now;
}