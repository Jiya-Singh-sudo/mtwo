import React from "react";
import styles from "./GovernmentLayout.module.css";
import Carousel from '../carousel/Carousel'

export default function GovernmentLayout({ children }: { children: React.ReactNode }) {
  const images = [
    "/c1.jpg",
    "/c2.jpg",
    "/c3.jpg",
    "/c4.jpg",
    "/c5.jpg",
    "/c6.jpg"
  ];

  return (
    <div className={styles.layoutWrapper}>

      {/* TOP BAR */}
      <div className={styles.topBar}>
        <p className={styles.marathiText}>महाराष्ट्र शासन</p>
        <div className={styles.separator}></div>
        <p className={styles.englishText}>Government of Maharashtra</p>

        <div className={styles.topIcons}>
          <span className="material-symbols-outlined">home</span>
          <span className="material-symbols-outlined">build</span>
          <span className="material-symbols-outlined">search</span>
          <span className={styles.languageText}>ENGLISH</span>
        </div>
      </div>

      {/* HEADER */}
      <div className={styles.headerSection}>
        <div className={styles.emblem}>
          <img src="/Emblem_of_India.svg.png" className={styles.emblemImg} />
        </div>

        <div className={styles.logoText}>
          <p className={styles.govtNameHindi}>राजभवन महाराष्ट्र</p>
          <p className={styles.govtNameEnglish}>Raj Bhavan Maharashtra</p>
          <p className={styles.satyamevText}>सत्यमेव जयते</p>
        </div>

        <div className={styles.headerRight}>
          <img src="/2019112016.png" className={styles.sealImg} />
          <img src="/Flag_of_India.svg.png" className={styles.flagImg} />
        </div>
      </div>

      {/* HERO IMAGE */}
      {/* <div className={styles.heroImage}>
        <img src="/202309181239631543-1024x683.jpg" />
      </div> */}

      {/* CAROUSEL SECTION */}
      <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
        <Carousel
          autoplay={true}
          autoplayDelay={1000}
          loop={true}
          pauseOnHover={true}
          images={images}
        />
      </div>

      {/* NAV BAR */}
      <div className={styles.navBar}>
        <div className={styles.navItem}>Home</div>
        <div className={styles.navItem}>About Rajbhavan</div>
        <div className={styles.navItem}>Notices</div>
        <div className={styles.navItem}>Public Relations</div>
      </div>

      {/* PAGE CONTENT */}
      <main className={styles.roleManagement}>
        {children}
      </main>
    </div>
  );
}
