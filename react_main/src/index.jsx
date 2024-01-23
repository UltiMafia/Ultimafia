import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { NewMain } from "./NewMain";

ReactDOM.render(
  <Router>
    <NewMain />
  </Router>,
  document.getElementById("root")
);
