export const SIDEBAR_ICON_STORAGE_KEY = "omeropsmap_sidebar_icons";

export const defaultSidebarEmojiIcons = {
  "רובעים": "🏢",
  "חירום": "🚨",
  "חינוך": "🏫",
  "בריאות": "🏥",
  "תחבורה": "🚌",
  "תשתיות": "🏗️",
  "ספורט": "⚽️",
  "ספורט ופנאי": "🏀",
  "תרבות": "🎭",
  "קהילה": "👥",
  "שירותים עירוניים": "🏛️",
  "ללא קטגוריה": "📁",
};

export const emojiPickerGroups = [
  {
    id: "faces",
    label: "פנים",
    emojis: ["😀", "😊", "😉", "😍", "😎", "🤩", "🥳", "🤔", "😴", "🤖", "👻", "💩"],
  },
  {
    id: "hearts",
    label: "לבבות",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤍", "🤎", "💔", "💕", "💯", "🙏"],
  },
  {
    id: "nature",
    label: "טבע",
    emojis: ["🌳", "🌿", "🍀", "🌸", "🌞", "🌧️", "⚡️", "🔥", "💧", "🌊", "🌈", "🌍"],
  },
  {
    id: "food",
    label: "אוכל",
    emojis: ["🍎", "🍔", "🍕", "🥗", "🍣", "🍪", "🍰", "☕️", "🍺", "🍷", "🧃", "🍽️"],
  },
  {
    id: "sports",
    label: "ספורט",
    emojis: ["⚽️", "🏀", "🏈", "🎾", "🏐", "🥊", "🏋️‍♂️", "🏊‍♀️", "🚴‍♂️", "🏆", "🥇", "🎯"],
  },
  {
    id: "places",
    label: "מקומות",
    emojis: ["🏠", "🏢", "🏫", "🏥", "🏦", "🏛️", "⛪️", "🕌", "🚏", "🗺️", "🚦", "🏗️"],
  },
  {
    id: "objects",
    label: "חפצים",
    emojis: ["📱", "💻", "⌚️", "📷", "🔧", "🛠️", "🔑", "📌", "📍", "🗂️", "📝", "🔒"],
  },
];

export function loadSidebarEmojiIcons() {
  try {
    const raw = localStorage.getItem(SIDEBAR_ICON_STORAGE_KEY);
    if (!raw) return { ...defaultSidebarEmojiIcons };
    return { ...defaultSidebarEmojiIcons, ...JSON.parse(raw) };
  } catch {
    return { ...defaultSidebarEmojiIcons };
  }
}

export function saveSidebarEmojiIcons(iconMap) {
  localStorage.setItem(SIDEBAR_ICON_STORAGE_KEY, JSON.stringify(iconMap));
}

