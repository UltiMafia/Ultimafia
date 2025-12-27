import React, { useState, useEffect, useContext, useReducer } from "react";
import axios from "axios";
import update from "immutability-helper";
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { UserContext } from "../../Contexts";
import { useErrorAlert } from "../../components/Alerts";
import { NameWithAvatar, StatusIcon } from "../User/User";
import { getPageNavFilterArg, PageNav } from "../../components/Nav";
import { Time } from "../../components/Basic";
import {
  Box,
  Grid,
  TextField,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

function renderEventContent(eventInfo) {
  return(
    <>
      <Typography>
        {eventInfo.timeText}
      </Typography>
      <Typography>
        {eventInfo.event.title}
      </Typography>
    </>
  )
}

export default function Calendar(props) {
  const theme = useTheme();
  const user = useContext(UserContext);

  const [events, updateEvents] = useReducer((state, action) => {
    switch (action.type) {
      case "add": {
        return update(state, {
          $push: [action.event]
        });
      }
      default: {
        throw Error(`Unknown action type ${action.type}`);
      }
    }
  }, []);

  useEffect(() => {
    document.title = "Calendar | UltiMafia";

    axios.get(`/api/competitive/seasons`).then((response => {
      const seasons = response.data;
      for (const season of seasons) {
        for (const round of season.rounds) {
          console.log(`Rendering season ${season.number} round ${round.number}`);
          updateEvents({
            type: "add",
            event: {
              title: `Competitive Season ${season.number} Round ${round.number}`,
              start: round.startDate,
              end: round.endDate,
            },
          })
        }
      }
    }));
  }, []);

  return (
    <FullCalendar
      plugins={[ dayGridPlugin ]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next',
        center: 'title',
        right: 'dayGridWeek,dayGridMonth'
      }}
      events={events}
      eventContent={renderEventContent}
    />
  );
}
