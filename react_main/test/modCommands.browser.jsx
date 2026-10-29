// Test page for test/run-mod-commands.cjs: builds the real mod command
// definitions and exposes the Ban and Unban forms and the appeal tally text.
import React from "react";
import ReactDOM from "react-dom";
import { SiteInfoContext } from "../src/Contexts";
import {
  formatAppealTally,
  useModCommands,
} from "../src/pages/Policy/Moderation/commands";

function describeArgs(command) {
  return command.args.map((arg) => ({
    label: arg.label,
    name: arg.name,
    type: arg.type,
    default: arg.default ?? null,
    options: (arg.options || []).map((option) => option.value ?? null),
    optionLabels: (arg.options || []).map((option) => option.label ?? null),
  }));
}

function Probe() {
  const commands = useModCommands({}, () => {}, () => {});
  window.__modCommands = {
    Ban: describeArgs(commands.Ban),
    Unban: describeArgs(commands.Unban),
  };
  window.__tally = [
    formatAppealTally({ admins: 2, accept: 1, acceptAt: 2, deny: 0, denyAt: 1 }),
    formatAppealTally({ admins: 1, accept: 0, acceptAt: 1, deny: 1, denyAt: 1 }),
    formatAppealTally({ admins: 0, accept: 0, acceptAt: 0, deny: 0, denyAt: 0 }),
  ];
  return <div>ready</div>;
}

ReactDOM.render(
  <SiteInfoContext.Provider value={{ showAlert() {} }}>
    <Probe />
  </SiteInfoContext.Provider>,
  document.getElementById("root"),
);
window.__modCommandsReady = true;
