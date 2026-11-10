import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { useErrorAlert } from "components/Alerts";
import { SiteInfoContext } from "Contexts";
import Setup from "components/Setup";
import { UiAction, UiDialog, UiField, UiIcon, UiPending } from "components/ui";
import { LatestRequest } from "../../../lib/latestRequest";

export default function CompetitiveManagement() {
  const [seasonData, setSeasonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [addSetupDialogOpen, setAddSetupDialogOpen] = useState(false);
  const [addSetupRoundIndex, setAddSetupRoundIndex] = useState(null);
  const [setupIdToAdd, setSetupIdToAdd] = useState("");
  const [addingSetup, setAddingSetup] = useState(false);
  const errorAlert = useErrorAlert();
  const siteInfo = useContext(SiteInfoContext);
  const reads = useRef(new LatestRequest());
  const savingRef = useRef(false);

  useEffect(() => {
    const owner = reads.current, request = owner.begin();
    setLoading(true); setError("");
    axios.get("/api/competitive/current", { signal: request.signal })
      .then(({ data }) => {
        if (!request.isCurrent()) return;
        if (data?.setups?.length && data?.setupOrder) setSeasonData(data);
        else setError("No competitive season is configured.");
      })
      .catch(() => { if (request.isCurrent()) setError("Could not load the competitive season. Please try again."); })
      .finally(() => { if (request.isCurrent()) setLoading(false); });
    return () => owner.invalidate();
  }, [retry]);

  function moveSetup(roundIndex, setupIndex, direction) {
    if (!seasonData) return;
    const order = seasonData.setupOrder.map(round => [...round]);
    const setupNumber = order[roundIndex][setupIndex];
    if (direction === "up" && roundIndex > 0) { order[roundIndex].splice(setupIndex, 1); order[roundIndex - 1].push(setupNumber); }
    else if (direction === "down" && roundIndex < order.length - 1) { order[roundIndex].splice(setupIndex, 1); order[roundIndex + 1].push(setupNumber); }
    else return;
    setSeasonData({ ...seasonData, setupOrder: order }); setDirty(true);
  }

  async function handleSave() {
    if (!seasonData || savingRef.current) return;
    savingRef.current = true; setSaving(true); setError("");
    try {
      await axios.post("/api/competitive/updateSetupOrder", { setupOrder: seasonData.setupOrder });
      siteInfo.showAlert("Competitive setup order saved.", "success");
      setDirty(false);
    } catch (failure) { setError(typeof failure.response?.data === "string" ? failure.response.data : "Could not save the setup order. Please try again."); }
    finally { savingRef.current = false; setSaving(false); }
  }

  function handleRemoveSetup(roundIndex, setupIndex) {
    if (!seasonData) return;
    const order = seasonData.setupOrder.map(round => [...round]);
    order[roundIndex].splice(setupIndex, 1);
    setSeasonData({ ...seasonData, setupOrder: order }); setDirty(true);
  }

  async function handleConfirmAddSetup() {
    if (!seasonData || !setupIdToAdd.trim() || addingSetup) return;
    setAddingSetup(true); setError("");
    try {
      await axios.post("/api/competitive/addSetup", { setupId: setupIdToAdd.trim(), roundIndex: addSetupRoundIndex });
      const { data } = await axios.get("/api/competitive/current");
      if (data?.setups?.length && data?.setupOrder) { setSeasonData(data); setDirty(false); setAddSetupDialogOpen(false); setSetupIdToAdd(""); }
      else setError("The setup was added, but the season could not be reloaded.");
    } catch (failure) { setError(typeof failure.response?.data === "string" ? failure.response.data : "Could not add this setup. Please try again."); }
    finally { setAddingSetup(false); }
  }

  return <section className="moderation-competitive">
    <header className="moderation-section-heading"><h2>Competitive management</h2><p>Choose which setups appear in each competitive round. Changes are saved explicitly.</p></header>
    {loading && <UiPending label="Loading competitive season" />}
    {error && <div role="alert"><p>{error}</p>{!seasonData && <UiAction onClick={() => setRetry(value => value + 1)}>Retry</UiAction>}</div>}
    {seasonData && <>
      <div className="competitive-rounds">
        {seasonData.setupOrder.map((roundSetups, roundIndex) => <section className="competitive-round" key={roundIndex}>
          <header><h3>Round {roundIndex + 1}</h3><UiAction iconOnly variant="ghost" aria-label={`Add setup to round ${roundIndex + 1}`} onClick={() => { setAddSetupRoundIndex(roundIndex); setSetupIdToAdd(""); setAddSetupDialogOpen(true); }}><UiIcon name="add" /></UiAction></header>
          {roundSetups.length === 0 ? <p className="moderation-row-meta">No setups in this round.</p> : <ol className="competitive-setup-list">
            {roundSetups.map((setupNumber, setupIndex) => {
              const setup = seasonData.setups?.[setupNumber];
              return <li key={`${roundIndex}-${setupIndex}`} className="competitive-setup">
                <div className="competitive-setup-order">
                  <UiAction iconOnly variant="ghost" aria-label={`Move setup ${setupIndex + 1} up`} disabled={roundIndex === 0} onClick={() => moveSetup(roundIndex, setupIndex, "up")}><UiIcon name="up" size={16} /></UiAction>
                  <UiAction iconOnly variant="ghost" aria-label={`Move setup ${setupIndex + 1} down`} disabled={roundIndex === seasonData.setupOrder.length - 1} onClick={() => moveSetup(roundIndex, setupIndex, "down")}><UiIcon name="down" size={16} /></UiAction>
                </div>
                <div className="competitive-setup-content">{setup?.id ? <Setup setup={setup} summary /> : <p role="alert">Setup index {setupNumber} is missing or has no ID.</p>}</div>
                <UiAction iconOnly variant="danger-quiet" aria-label={`Remove setup ${setupIndex + 1} from round ${roundIndex + 1}`} onClick={() => handleRemoveSetup(roundIndex, setupIndex)}><UiIcon name="close" size={16} /></UiAction>
              </li>;
            })}
          </ol>}
        </section>)}
      </div>
      <div className="competitive-save"><span>{dirty ? "Unsaved changes" : "All changes saved"}</span><UiAction variant="primary" busy={saving} disabled={!dirty} onClick={handleSave}>Save changes</UiAction></div>
    </>}
    <UiDialog open={addSetupDialogOpen} title={`Add setup to round ${addSetupRoundIndex !== null ? addSetupRoundIndex + 1 : ""}`} onClose={addingSetup ? undefined : () => setAddSetupDialogOpen(false)}
      actions={<><UiAction disabled={addingSetup} onClick={() => setAddSetupDialogOpen(false)}>Cancel</UiAction><UiAction variant="primary" busy={addingSetup} disabled={!setupIdToAdd.trim()} onClick={handleConfirmAddSetup}>Add setup</UiAction></>}>
      <UiField label="Setup ID" value={setupIdToAdd} disabled={addingSetup} onChange={event => setSetupIdToAdd(event.target.value)} placeholder="Enter a competitive setup ID" fullWidth />
      {error && <p role="alert">{error}</p>}
    </UiDialog>
  </section>;
}
