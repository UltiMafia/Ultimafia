import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { UserSearchSelect } from "components/Form";
import { SiteInfoContext } from "Contexts";
import { Badge, NameWithAvatar, StatusIcon } from "pages/User/UserWidgets";
import { UiAction, UiDialog, UiIcon, UiPending } from "components/ui";
import { LatestRequest } from "../../../lib/latestRequest";

// Fixed display order; any other group follows, highest rank first.
const GROUP_ORDER = ["Owner", "Developer", "Admin", "Mod", "Moderator", "Liaison"];

function orderGroups(groups) {
  const position = (group) => {
    const index = GROUP_ORDER.indexOf(group.name);
    return index === -1 ? GROUP_ORDER.length : index;
  };
  return [...groups].sort((a, b) => position(a) - position(b) || b.rank - a.rank);
}

export function GroupPanels({ user }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [addingToGroup, setAddingToGroup] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchName, setSearchName] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [pending, setPending] = useState(false);
  const requests = useRef(new LatestRequest());
  const submitting = useRef(false);
  const siteInfo = useContext(SiteInfoContext);
  const canManageGroup = Boolean(user?.perms?.giveGroup);

  useEffect(() => {
    const owner = requests.current, request = owner.begin();
    setLoading(true); setError("");
    axios.get("/api/mod/groups", { signal: request.signal })
      .then(({ data }) => { if (request.isCurrent()) setGroups(orderGroups(Array.isArray(data) ? data : [])); })
      .catch(() => { if (request.isCurrent()) setError("Could not load staff groups. Please try again."); })
      .finally(() => { if (request.isCurrent()) setLoading(false); });
    return () => owner.invalidate();
  }, [retry]);

  async function changeMembership() {
    if (!confirmation || submitting.current) return;
    submitting.current = true; setPending(true); setError("");
    try {
      if (confirmation.type === "add") await axios.post("/api/mod/addToGroup", { groupName: confirmation.group, userId: selectedUser });
      else await axios.post("/api/mod/removeFromGroup", { groupName: confirmation.group, userId: confirmation.member.id });
      setConfirmation(null); setAddingToGroup(null); setSelectedUser(null); setSearchName("");
      setRetry(value => value + 1);
    } catch (_) { setError("Could not update this staff group. Please try again."); }
    finally { submitting.current = false; setPending(false); }
  }

  if (loading && !groups.length) return <UiPending label="Loading staff groups" />;
  if (error && !groups.length) return <div role="alert"><p>{error}</p><UiAction onClick={() => setRetry(value => value + 1)}>Retry</UiAction></div>;

  return <section className="moderation-groups" aria-label="Staff groups">
    {error && <p role="alert">{error}</p>}
    {groups.length === 0 && !loading && <p>No staff groups are configured.</p>}
    {groups.map(group => <section className="moderation-group" key={group.name}>
      <header>
        <h3>{group.name}s</h3>
        {group.badge && <Badge icon={group.badge} color={group.badgeColor || "black"} name={group.name} />}
        {canManageGroup && <UiAction iconOnly variant="ghost" aria-label={`Add user to ${group.name}`} onClick={() => { setAddingToGroup(group.name); setSelectedUser(null); setSearchName(""); }}>
          <UiIcon name="addPerson" />
        </UiAction>}
      </header>
      <div className="moderation-group-members">
        {group.members.map(member => <div className="moderation-group-member" key={member.id}>
          <NameWithAvatar id={member.id} name={member.name} avatar={member.avatar} />
          <StatusIcon status={member.status} />
          {canManageGroup && <UiAction iconOnly variant="danger-quiet" aria-label={`Remove ${member.name} from ${group.name}`} onClick={() => setConfirmation({ type: "remove", group: group.name, member })}>
            <UiIcon name="close" size={16} />
          </UiAction>}
        </div>)}
        {group.members.length === 0 && <p className="moderation-row-meta">No members.</p>}
      </div>
    </section>)}
    <UiDialog open={!!addingToGroup} title={`Add user to ${addingToGroup || ""}`} onClose={pending ? undefined : () => setAddingToGroup(null)}
      actions={<><UiAction disabled={pending} onClick={() => setAddingToGroup(null)}>Cancel</UiAction><UiAction variant="primary" busy={pending} disabled={!selectedUser} onClick={() => setConfirmation({ type: "add", group: addingToGroup })}>Add to group</UiAction></>}>
      <UserSearchSelect value={searchName} placeholder="Find a player" onChange={(id, name) => { setSelectedUser(id); setSearchName(name || ""); }} />
      {selectedUser && <p>Add {searchName || "this player"} to {addingToGroup}?</p>}
    </UiDialog>
    <UiDialog open={!!confirmation} title={confirmation?.type === "remove" ? "Remove group member?" : "Add group member?"} onClose={pending ? undefined : () => setConfirmation(null)}
      actions={<><UiAction disabled={pending} onClick={() => setConfirmation(null)}>Cancel</UiAction><UiAction variant={confirmation?.type === "remove" ? "danger" : "primary"} busy={pending} onClick={changeMembership}>{confirmation?.type === "remove" ? "Remove member" : "Add member"}</UiAction></>}>
      <p>{confirmation?.type === "remove" ? `Remove ${confirmation?.member.name} from ${confirmation?.group}?` : `Add ${searchName || "this player"} to ${confirmation?.group}?`}</p>
    </UiDialog>
  </section>;
}
