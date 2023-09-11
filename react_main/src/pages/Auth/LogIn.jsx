import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithRedirect,
} from "firebase/auth";
import axios from "axios";

import LoadingPage from "../Loading";
import { useErrorAlert } from "../../components/Alerts";
import { Modal } from "../../components/Modal";
import { SiteInfoContext } from "../../Contexts";
import { verifyRecaptcha } from "../../utils";

export default function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    document.title = "Log In | UltiMafia";
  }, []);

  useEffect(() => {
    setSubmitDisabled(email.length === 0 || password.length === 0);
  }, [email, password]);

  async function onSubmit(e) {
    try {
      e.preventDefault();

      if (submitDisabled) return;

      setLoading(true);
      await verifyRecaptcha("auth");

      const auth = getAuth();
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCred.user.getIdToken(true);
      axios
        .post("/auth", { idToken })
        .then(() => {
          window.location.reload();
        })
        .catch((e) => {
          errorAlert(e);
          setLoading(false);

          try {
            if (e.response && e.response.status === 403)
              sendEmailVerification(userCred.user);
          } catch (e) {}
        });
    } catch (e) {
      setLoading(false);

      if (!e || !e.message) return;

      if (e.message.indexOf("(auth/too-many-requests)") !== -1)
        errorAlert(
          "Too many login attempts on this account. Please try again later."
        );
      else errorAlert("Failed to login. Please check your account details.");
    }
  }

  async function onResetPw(e) {
    try {
      e.preventDefault();
      setShowResetPw(false);
      setLoading(true);

      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);

      siteInfo.showAlert("Password reset email sent.", "success");
      setLoading(false);
    } catch (e) {
      errorAlert("Error resetting password.");
      setLoading(false);
    }
  }

  async function googleSubmit(e) {
    try {
      e.preventDefault();
      setLoading(true);
      await verifyRecaptcha("auth");
      await signInWithRedirect(getAuth(), googleProvider);
    } catch (e) {
      setLoading(false);
      if (!e || !e.message) return;

      if (e.message.indexOf("(auth/too-many-requests)") !== -1)
        errorAlert(
          "Too many login attempts on this account. Please try again later."
        );
      else errorAlert("Failed to login. Please check your account details.");
    }
  }

  const modalContent = (
    <form className="form" onSubmit={onResetPw}>
      <div className="field-wrapper">
        <div className="label">Email</div>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
    </form>
  );
  const modalFooter = (
    <div className="control">
      <div className="reset btn btn-theme" onClick={onResetPw}>
        Reset
      </div>
      <div
        className="cancel btn btn-theme-third"
        onClick={() => setShowResetPw(false)}
      >
        Cancel
      </div>
    </div>
  );

  if (loading) return <LoadingPage />;

  return (
    <div className="span-panel main login">
      <form className="form" onSubmit={onSubmit}>
        <div className="field-wrapper">
          <div className="label">Email</div>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field-wrapper">
          <div className="label">Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <a className="forgot-pw" href="#" onClick={() => setShowResetPw(true)}>
          Forgot password?
        </a>
        <input
          className={`auth-btn ${submitDisabled ? "disabled" : ""}`}
          type="submit"
          value="Log In"
        />
      </form>

      <div className="or">or</div>

      <div
        className="auth-btn google"
        onClick={googleSubmit}>
        <img src="/images/icons/google.webp" alt="Google" />
        Log In with Google
      </div>

      <div className="legal">
        By logging in you agree to follow our{" "}
        <Link to="/legal/tos">Terms of Service </Link>
        and accept our <Link to="/legal/privacy">Privacy Policy</Link>.
      </div>
      <Modal
        className="reset-pw"
        show={showResetPw}
        onBgClick={() => setShowResetPw(false)}
        header={"Reset Password"}
        content={modalContent}
        footer={modalFooter}
      />
    </div>

    
  );
}
