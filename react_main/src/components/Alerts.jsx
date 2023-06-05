import React, { useContext } from "react";
import { SiteInfoContext } from "../Contexts";

import "../css/alerts.css";

export function AlertList(props) {
  const siteInfo = useContext(SiteInfoContext);

  const alerts = siteInfo.alerts.map((alert, i) => {
    return (
      <Alert
        id={alert.id}
        index={i}
        text={alert.text}
        type={alert.type}
        onHide={siteInfo.hideAlert}
        key={alert.id}
      />
    );
  });

  return <div className="alert-list">{alerts}</div>;
}

export function Alert(props) {
  return (
    <div id={`alert-id-${props.id}`} className={`alert alert-${props.type}`}>
      <i
        className={`hide-alert fa-times-circle fas`}
        onClick={() => props.onHide(props.index)}
      />
      {props.text}
    </div>
  );
}

export function useErrorAlert(siteInfo) {
  const siteInfoContext = useContext(SiteInfoContext);
  siteInfo = siteInfo || siteInfoContext;

  return (e) => {
    var message;

    if (e && e.response) message = e.response.data;
    else if (e && e.message) message = e.message;
    else if (typeof e == "string") message = e;
    else message = "Error loading data";

    if (message.length > 200) message = "Connection error";

    siteInfo.showAlert(message, "error");
  };
}
