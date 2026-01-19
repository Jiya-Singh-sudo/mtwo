import { useTranslation } from "react-i18next";

/**
 * Language toggle button for switching between English and Marathi.
 * Persists selection to localStorage for NIC-friendly persistence.
 * 
 * Place this in Header/Navbar so it applies globally to all pages.
 */
export function LanguageToggle() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const next = i18n.language === "en" ? "mr" : "en";
        i18n.changeLanguage(next);
        localStorage.setItem("lang", next);
    };

    return (
        <button
            className="langToggle"
            onClick={toggleLanguage}
            aria-label="Toggle language"
        >
            {i18n.language === "en" ? "मराठी" : "English"}
        </button>
    );
}

export default LanguageToggle;
