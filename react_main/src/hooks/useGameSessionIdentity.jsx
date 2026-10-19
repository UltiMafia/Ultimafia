import { useContext, useEffect, useRef } from "react";
import { UserContext } from "../Contexts";

// A retained authenticated (or guest) game must not be reused after account
// identity changes. Hide its content immediately, then let its owner tear down
// the session. Refreshes for the same account do not change its identity.
export function useGameSessionIdentity(onChange) {
  const user = useContext(UserContext);
  const identity = user.id || null;
  const originalIdentity = useRef(identity);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valid = !user.loaded || identity === originalIdentity.current;
  useEffect(() => {
    if (!valid) onChangeRef.current();
  }, [valid]);
  return valid;
}
