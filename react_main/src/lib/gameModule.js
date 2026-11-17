let pending;

// Share an in-flight code request between early route preload and React.lazy.
// Nothing here connects a game or changes membership before authentication.
export function loadGameModule() {
  if (!pending) pending = import("../pages/Game/Game").catch(error => {
    pending = undefined;
    throw error;
  });
  return pending;
}
