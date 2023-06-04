import React from "react";
import ReactLoading from "react-loading";

export default function LoadingPage(props) {
  return (
    <div className={`loading-page ${props.className || ""}`}>
      <ReactLoading type="bars" color="#ffffff" />
    </div>
  );
}

export function LoadingIcon() {
  return (
    <div className="loading-page">
      <ReactLoading type="bars" color="#ffffff" width="50" height="50" />
    </div>
  );
}
