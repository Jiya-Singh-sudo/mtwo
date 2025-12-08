import React from "react";
import styles from "./LoginPage.module.css";

const LoginPage: React.FC = () => {
  return (
    <div className={styles.page}>

      {/* Grey Top Navigation Strip (Option B) */}
      <div className={styles.topNav}>
        <div className={styles.navLeft}>Home</div>
        <div className={styles.navRight}>English</div>
      </div>

      <div className={styles.container}>

        {/* LEFT SIDE — LOGIN FORM */}
        <div className={styles.loginCard}>
          <h2 className={styles.loginTitle}>Login</h2>

          <label className={styles.label}>Username</label>
          <input className={styles.input} type="text" placeholder="Enter your username" />

          <label className={styles.label}>Password</label>
          <input className={styles.input} type="password" placeholder="Enter your password" />

          <div className={styles.forgotRow}>
            <span className={styles.forgotPassword}>Forgot Password?</span>
          </div>

          <label className={styles.label}>Captcha</label>
          <div className={styles.captchaRow}>
            <div className={styles.captchaBox}>A7K9X</div>
            <input className={styles.input} placeholder="Enter captcha" />
          </div>

          <div className={styles.buttonRow}>
            <button className={styles.signIn}>Sign In</button>
            <button className={styles.register}>Register</button>
          </div>
        </div>

        {/* RIGHT SIDE — IMAGE PINNED */}
        <div className={styles.imageWrapper}>
          <img
            src="/login-image.jpg" /* Replace with your actual image */
            alt="Raj Bhavan"
            className={styles.sideImage}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;