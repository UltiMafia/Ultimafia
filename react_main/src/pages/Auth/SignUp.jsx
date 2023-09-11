import React, { useState, useEffect, useContext } from "react";
import { Link, Redirect } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  signInWithRedirect,
  GoogleAuthProvider,
} from "firebase/auth";

import LoadingPage from "../Loading";
import { useErrorAlert } from "../../components/Alerts";
import { SiteInfoContext } from "../../Contexts";
import { verifyRecaptcha } from "../../utils";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConf, setPasswordConf] = useState("");
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const googleProvider = new GoogleAuthProvider();

  const allowedEmailDomans = JSON.parse(process.env.REACT_APP_EMAIL_DOMAINS);

  useEffect(() => {
    document.title = "Sign Up | UltiMafia";
  }, []);

  useEffect(() => {
    setSubmitDisabled(
      email.length === 0 || password.length === 0 || password !== passwordConf
    );
  }, [email, password, passwordConf]);

  async function onSubmit(e) {
    try {
      e.preventDefault();

      if (submitDisabled) return;

      var emailDomain = email.split("@")[1] || "";

      if (allowedEmailDomans.indexOf(emailDomain) === -1) {
        errorAlert(
          "Email domain must be one of the following: " +
            allowedEmailDomans.join(", ")
        );
        return;
      }

      setLoading(true);
      await verifyRecaptcha("auth");

      const auth = getAuth();
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await sendEmailVerification(userCred.user);

      siteInfo.showAlert(
        "Account created. Please click the verification link in your email before logging in. Be sure to check your spam folder.",
        "success",
        true
      );
      setSignedUp(true);
      setLoading(false);
    } catch (e) {
      setLoading(false);

      if (!e || !e.message) return;

      if (e.message.indexOf("(auth/invalid-email)") !== -1)
        errorAlert("Invalid email.");
      else if (e.message.indexOf("(auth/weak-password)") !== -1)
        errorAlert("Password should be at least 6 characters.");
      else if (e.message.indexOf("(auth/email-already-in-use)") !== -1)
        errorAlert("Email already in use.");
      else errorAlert(e);
    }
  }

  if (loading) return <LoadingPage />;

  if (signedUp) return <Redirect to="/auth/login" />;

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
        <div className="field-wrapper">
          <div className="label">Confirm Password</div>
          <input
            type="password"
            value={passwordConf}
            onChange={(e) => setPasswordConf(e.target.value)}
          />
        </div>
        <input
          className={`auth-btn ${submitDisabled ? "disabled" : ""}`}
          type="submit"
          value="Sign Up"
        />
      </form>

      <div className="or">or</div>

      <div
        className="auth-btn google"
        onClick={googleSubmit}>
        <img src="/images/icons/google.webp" alt="Google" />
        Sign Up with Google
      </div>

      <div className="legal">
        By signing up you agree to follow our{" "}
        <Link to="/legal/tos">Terms of Service </Link>
        and accept our <Link to="/legal/privacy">Privacy Policy</Link>, and that
        you are at least 13 years of age.
      </div>
    </div>
  );
}
