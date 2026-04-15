/**
 * App-wide constants shared across components and hooks.
 * Centralizes magic values so they only need to change in one place.
 */

/** Geographic center of the city of Omer — used as the default map center on load. */
export const OMER_CENTER = [31.2632, 34.8419];

/**
 * Official district names for the city of Omer.
 * These must match exactly the district values stored in the database,
 * because they are used for both filtering and proximity-based district assignment.
 */
export const DISTRICTS = ["רובע א'", "רובע ב'", "רובע ג'", "רובע ד'", "פארק תעשיות"];
