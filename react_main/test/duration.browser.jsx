// Real Mafia host fields, reducer, renderer and request builder. No backend.
import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import Form, { useForm } from "../src/components/Form";
import HostMafia from "../src/components/gameTypeHostForms/HostMafia";

axios.defaults.adapter = async config => {
  window.__hostPayload = JSON.parse(config.data);
  return { data: "fixture-game", status: 200, headers: {}, config };
};
function Fixture() {
  const [initialFields, onHostGame] = HostMafia();
  const mode = new URLSearchParams(window.location.search).get("mode");
  for (const field of initialFields) {
    if (field.ref === mode) field.value = true;
  }
  const [fields, updateFields] = useForm(initialFields);
  const getValue = ref => fields.find(field => field.ref === ref)?.value;
  return <main style={{ maxWidth: 540, margin: "24px auto", padding: 16 }}>
    <h1>Mafia hosting duration fixture</h1>
    <Form compact fields={fields} onChange={updateFields} />
    <button onClick={() => onHostGame("fixture-setup", getValue)}>Submit fixture</button>
  </main>;
}
const root = document.createElement("div");
document.body.append(root);
ReactDOM.render(<ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
  <CssBaseline /><Fixture />
</ThemeProvider>, root);
