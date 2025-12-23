import React, { useState, useEffect, useContext, useReducer } from "react";
import axios from "axios";
import update from "immutability-helper";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { UserContext } from "../../Contexts";
import { QUERY_PARAM_SEASON, QUERY_PARAM_ROUND } from "../Fame/Competitive";
import {
  Box,
  Grid,
  TextField,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

function renderEventContent(eventInfo) {
  return (
    <>
      <Typography>{eventInfo.event.title}</Typography>
    </>
  );
}

export default function Calendar(props) {
  const theme = useTheme();
  const user = useContext(UserContext);
  const navigate = useNavigate();

  const [events, updateEvents] = useReducer((state, action) => {
    switch (action.type) {
      case "reset": {
        return update(state, {
          $set: [],
        });
      }
      case "add": {
        return update(state, {
          $push: [action.event],
        });
      }
      default: {
        throw Error(`Unknown action type ${action.type}`);
      }
    }
  }, []);

  useEffect(() => {
    document.title = "Calendar | UltiMafia";

    axios.get(`/api/competitive/seasons`).then((response) => {
      const seasons = response.data;
      const now = Date.now();
      updateEvents({ type: "reset" });
      for (const season of seasons) {
        for (const round of season.rounds) {
          let endDate = null;
          if (round.dateCompleted) {
            endDate = new Date(round.dateCompleted);
          } else {
            endDate = new Date(round.startDate);
            endDate.setDate(
              endDate.getDate() + round.currentDay + round.remainingOpenDays
            );
          }
          updateEvents({
            type: "add",
            event: {
              title: `Competitive Season ${season.number} Round ${round.number}`,
              start: round.startDate,
              end: endDate,
              extendedProps: {
                urlPath: `/fame/competitive?season=${season.number}&round=${round.number}`,
              },
            },
          });
        }
      }
    });
  }, []);

  const handleEventClick = (clickInfo) => {
    const { urlPath } = clickInfo.event.extendedProps;

    if (urlPath) {
      navigate(urlPath);
    }
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev,next",
        center: "title",
        right: "dayGridWeek,dayGridMonth",
      }}
      events={events}
      eventContent={renderEventContent}
      eventClick={handleEventClick}
    />
  );
}
