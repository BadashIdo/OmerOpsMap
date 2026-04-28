import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullhorn } from "@fortawesome/free-solid-svg-icons";
import FeedbackModal from "./FeedbackModal";
import styles from "../styles/FeedbackButton.module.css";

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.pill}
        onClick={() => setIsOpen(true)}
        title="שלח לנו משוב"
        aria-label="שלח לנו משוב"
      >
        <FontAwesomeIcon icon={faBullhorn} className={styles.icon} />
        <span className={styles.label}>שלח משוב</span>
      </button>
      {isOpen && <FeedbackModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
