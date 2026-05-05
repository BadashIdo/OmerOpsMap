import FeedbackModal from "./FeedbackModal";

export default function FeedbackButton({ open, onClose }) {
  const isOpen = open ?? false;
  const closeModal = onClose ?? (() => {});

  return isOpen ? <FeedbackModal onClose={closeModal} /> : null;
}
