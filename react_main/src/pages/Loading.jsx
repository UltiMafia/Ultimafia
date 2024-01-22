import React from "react";
import ReactLoading from "react-loading";

export default function LoadingPage(props) {
  return (
    <div className={`loading-page ${props.className || ""}`}>
      <ReactLoading type="bars" color="#ffffff" />
    </div>
  );
}
