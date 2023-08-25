import React, { useState, useEffect, useContext } from "react";
import axios from "axios";

import { useErrorAlert } from "../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../Contexts";

export default function Feedback(props) {
  //const [feedbackType, setFeedbackType] = useState();
  //const [feedbackCategory, setFeedbackCategory] = useState();
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedback, setFeedback] = useState("");

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Feedback | UltiMafia";
  }, []);

  //let feedbackTypes = ["suggestion box", "bug report"];
  //let feedbackCategories = ["mafia", "other games", "forums", "others"];

  function submitFeedback() {
    axios
      .post("/feedback/send", {
        //type: feedbackType,
        //category: feedbackCategory,
        title: feedbackTitle,
        value: feedback,
      })
      .then(() => {
        setFeedbackTitle("");
        setFeedback("");
        siteInfo.showAlert("We have received your feedback!", "success");
      })
      .catch(errorAlert);
  }

  return (
    <div className="feedback-page">
      <div className="span-panel main">
        {user.loggedIn && (
          <>
            <div className="heading">
              Thanks so much for taking the time to drop us some feedback/ bug
              reports!
            </div>
            <div className="feedback-form form">
              <div className="field-wrapper">
                <div className="label">Title:</div>
                <input
                  type="text"
                  placeholder="Title"
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                />
              </div>
              <div className="field-wrapper">
                <div className="label">Feedback:</div>
                <input
                  type="text"
                  placeholder="Feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
              <div
                className="btn btn-theme-sec submit"
                onClick={submitFeedback}
              >
                Submit
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
