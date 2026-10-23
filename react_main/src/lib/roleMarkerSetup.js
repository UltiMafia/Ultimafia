// Where the role-marker chooser gets its setup from. usePopover() reads
// `res.data` from whatever it is given (an axios response), so an in-memory
// setup must be wrapped as { data } just like an axios.get result.
//   - Tutorial games (and any game whose setup object already has roles): use
//     the setup on the game. Tutorial setups are not in the database.
//   - Otherwise: fetch /api/setup/<id> through axios (a string path).
export function roleMarkerSetupSource(setup) {
  if (setup && setup.roles) {
    const roles =
      typeof setup.roles === "string"
        ? setup.roles
        : JSON.stringify(setup.roles);
    return Promise.resolve({ data: { ...setup, roles } });
  }
  if (setup && setup.id) return `/api/setup/${setup.id}`;
  return Promise.resolve({ data: { roles: "[]" } });
}

// Flatten a setup's roles ("[{...}]" string or array of role-count maps) into
// one { "Role:Modifier": count } map for the chooser.
export function roleMarkerRoles(raw) {
  const list =
    typeof raw === "string" ? JSON.parse(raw || "[]") : raw || [];
  const roles = {};
  for (const r of Array.isArray(list) ? list : [list]) Object.assign(roles, r);
  return roles;
}
