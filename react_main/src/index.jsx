import React from "react";
import ReactDOM from "react-dom";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "lib/firebaseConfig";

import Main from "./Main";

initializeApp(firebaseConfig);

ReactDOM.render(<Main />, document.getElementById("root"));
