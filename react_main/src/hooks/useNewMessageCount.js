import { useEffect, useRef, useState } from "react";

// A larger transcript is only new activity within the same live view. Initial
// loads, navigation and display-option changes establish a fresh baseline.
export function useNewMessageCount({
  messageCount,
  transcriptKey,
  enabled,
  autoScroll,
}) {
  const previousRef = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = { messageCount, transcriptKey, enabled };

    if (
      !enabled ||
      autoScroll ||
      !previous ||
      !previous.enabled ||
      previous.transcriptKey !== transcriptKey
    ) {
      setCount(0);
    } else if (messageCount > previous.messageCount) {
      setCount((current) => current + messageCount - previous.messageCount);
    }
  }, [messageCount, transcriptKey, enabled, autoScroll]);

  // Do not briefly show the old view's count before its reset effect runs.
  return enabled &&
    !autoScroll &&
    previousRef.current?.transcriptKey === transcriptKey
    ? count
    : 0;
}
