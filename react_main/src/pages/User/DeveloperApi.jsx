import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

import { UserContext } from "Contexts";
import { useErrorAlert } from "components/Alerts";

const formatTime = (time) => (time ? new Date(time).toLocaleString() : "Never");

export default function DeveloperApi() {
  const user = useContext(UserContext);
  const errorAlert = useErrorAlert();
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState("");
  const [created, setCreated] = useState(null);
  const isOwner = Number(user.rank) === Infinity;

  function load() {
    axios
      .get(isOwner ? "/api/dev/owner/keys" : "/api/dev/keys")
      .then((res) => setKeys(res.data))
      .catch(errorAlert);
  }

  useEffect(load, [isOwner]);

  function createKey() {
    axios
      .post("/api/dev/keys", { name })
      .then((res) => {
        setCreated(res.data);
        setName("");
        load();
      })
      .catch(errorAlert);
  }

  function revoke(clientId) {
    axios
      .post(`/api/dev/keys/${clientId}/revoke`)
      .then(load)
      .catch(errorAlert);
  }

  if (!user.perms?.devApi)
    return <Typography>Only developers can use the developer API.</Typography>;

  return (
    <div className="box-panel">
      <Stack spacing={2}>
        <Typography variant="h3">Developer API</Typography>
        <Typography>
          Exchange a key for a short-lived token at POST /api/dev/token, then
          send it as Authorization: Bearer &lt;token&gt;.
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            label="Key name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button variant="contained" onClick={createKey}>
            Create key
          </Button>
        </Stack>
        {created && (
          <div className="box-panel">
            <Typography>
              Copy the secret now. It is shown only once.
            </Typography>
            <Typography sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
              Client ID: {created.clientId}
              <br />
              Client secret: {created.clientSecret}
            </Typography>
          </div>
        )}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Client ID</TableCell>
              {isOwner && <TableCell>Developer</TableCell>}
              <TableCell>Created</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell>Last used</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.clientId}>
                <TableCell>{key.name}</TableCell>
                <TableCell sx={{ fontFamily: "monospace" }}>{key.clientId}</TableCell>
                {isOwner && <TableCell>{key.userId}</TableCell>}
                <TableCell>{formatTime(key.createdAt)}</TableCell>
                <TableCell>{formatTime(key.expiresAt)}</TableCell>
                <TableCell>{formatTime(key.lastUsedAt)}</TableCell>
                <TableCell>
                  {key.revokedAt ? (
                    "Revoked"
                  ) : (
                    <Button color="error" size="small" onClick={() => revoke(key.clientId)}>
                      Revoke
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
    </div>
  );
}
