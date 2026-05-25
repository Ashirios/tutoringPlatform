import { Link, useNavigate } from "react-router";
import styles from "./Navigation.module.css";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; 

export const Navigation = () => {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  
  const [userEmail, setUserEmail] = useState(null);

  // Оставляем ОДНУ функцию здесь, чтобы её можно было использовать везде
  const checkAuth = () => {
    const token = localStorage.getItem("jwt");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserEmail(decoded.email || null);
      } catch (error) {
        console.error("Invalid token", error);
        localStorage.removeItem("jwt");
        setUserEmail(null);
      }
    } else {
      setUserEmail(null);
    }
  };

  // В useEffect просто вызываем её и вешаем слушатель событий
  useEffect(() => {
    checkAuth();

    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []); 


  const handleLogout = () => {
    localStorage.removeItem("jwt"); 
    setUserEmail(null);
    nav("/"); 
  };

  const getUserName = (email) => {
    if (!email) return "";
    return email.split("@")[0];
  };

  return (
    <nav className={styles.nav}>
      <Link to="/#heroPage" className={styles.logoFlex}>
        <img src="./logoIcon.svg" alt="" className={styles.logoIcon} />
        <div className={styles.logoTitle}>{t("nav.title")}</div>
      </Link>

      <div className={styles.navElements}>
        <div className={styles.navLinks}>
          <Link to="/#platforms">{t("nav.platforms")}</Link>
          <Link to="/#statistics">{t("nav.stats")}</Link>
          <Link to="/#opportunities">{t("nav.opportunities")}</Link>
          <Link to="/#contact">{t("nav.contact")}</Link>
        </div>

        <div className={styles.langChanger}>
          <div
            className={`${styles.lang} ${i18n.language === "ru" ? styles.active : ""}`}
            onClick={() => i18n.changeLanguage("ru")}
          >
            RU
          </div>
          <div
            className={`${styles.lang} ${i18n.language === "en" ? styles.active : ""}`}
            onClick={() => i18n.changeLanguage("en")}
          >
            EN
          </div>
        </div>

        {!userEmail ? (
          <button className={styles.loginButton} onClick={() => nav("/login")}>
            {t("auth.enter")}
          </button>
        ) : (
          <div className={styles.userMenu}>
            <span className={styles.userEmailText}>{getUserName(userEmail)}</span>
            <button className={styles.loginButton} onClick={handleLogout}>
              {t("auth.logout")}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
