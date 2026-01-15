import { useState, useRef, useEffect } from "react";
import styles from "../styles/SearchableDropdown.module.css";

/**
 * Searchable Dropdown Component
 * A dropdown with built-in search/filter functionality
 */
export default function SearchableDropdown({
    options = [],
    value,
    onChange,
    placeholder = "בחר אפשרות...",
    required = false,
    disabled = false,
    error = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchQuery("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter options based on search query
    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get display text
    const displayText = value || searchQuery || placeholder;

    const ignoreClickRef = useRef(false);

    const handleSelect = (option) => {
        onChange(option);
        setSearchQuery("");
        setIsOpen(false);
    };

    const handleInputChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (!isOpen) setIsOpen(true);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
        if (inputRef.current) {
            inputRef.current.select();
        }
    };

    const handleInputMouseDown = () => {
        // Set flag on mousedown (before click)
        ignoreClickRef.current = true;
    };

    const handleInputClick = () => {
        if (!ignoreClickRef.current) {
            setIsOpen((prev) => !prev);
        }
        // Reset immediately after click
        ignoreClickRef.current = false;
    };

    const handleArrowClick = (e) => {
        e.stopPropagation();
        setIsOpen((prev) => !prev);
        if (!isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <div className={styles.container} ref={dropdownRef}>
            <div className={`${styles.inputWrapper} ${error ? styles.error : ""}`}>
                <input
                    ref={inputRef}
                    type="text"
                    className={styles.input}
                    value={isOpen ? searchQuery : (value || "")}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onMouseDown={handleInputMouseDown}
                    onClick={handleInputClick}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    autoComplete="off"
                />
                <span
                    className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}
                    onClick={handleArrowClick}
                    style={{ cursor: "pointer" }}
                >
                    ▼
                </span>
            </div>

            {isOpen && (
                <div className={styles.dropdown}>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option}
                                className={`${styles.option} ${value === option ? styles.selected : ""}`}
                                onClick={() => handleSelect(option)}
                            >
                                {option}
                            </div>
                        ))
                    ) : (
                        <div className={styles.noResults}>אין תוצאות</div>
                    )}
                </div>
            )}
        </div>
    );
}
