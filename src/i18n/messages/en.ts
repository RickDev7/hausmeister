import type { Messages } from "./pt-BR";

export const en: Messages = {
  appName: "Waste Planner",
  nav: { home: "Home", calendar: "Calendar", history: "History", addresses: "Addresses", settings: "Settings" },
  home: { subtitle: "Your collection dates", today: "Today", tomorrow: "Tomorrow", upcoming: "Upcoming", noToday: "No collection today", noTomorrow: "No collection tomorrow", welcome: "Welcome to Waste Planner!", welcomeHint: "Import .ics files under \"Addresses\".", noFilterResults: "No collections match the filters." },
  checkIn: { action: "Check-in", done: "Done", undo: "Undo", note: "Note (optional)", photo: "Photo (optional)", confirm: "Confirm check-in" },
  calendar: { title: "Calendar", subtitle: "Monthly overview" },
  history: { title: "History", subtitle: "Collection check-ins", empty: "No check-ins yet", emptyHint: "Mark collections on the home screen.", stats: "Statistics", streak: "Current streak", total: "Total check-ins", thisMonth: "This month", byType: "By type" },
  addresses: { title: "Addresses", subtitle: "Manage ICS files", import: "Import .ics file", importWebcal: "Import via URL (webcal)", empty: "No addresses yet", collections: "collections", reimport: "Reimport", edit: "Edit address", delete: "Delete address?", save: "Save", cancel: "Cancel", deleteBtn: "Delete", nameAddress: "Name address" },
  settings: { title: "Settings", appearance: "Appearance", themeLight: "Light", themeDark: "Dark", themeSystem: "System", notifications: "Notifications", enableNotif: "Enable notifications", allow: "Allow", dayBefore: "Day before", dayOf: "Collection day", evening: "Evening reminder", eveningHint: "If no check-in by this time", time: "Time", testNotif: "Send test notification", profiles: "Profiles", addProfile: "New profile", backup: "Backup & restore", export: "Export backup", import: "Import backup", qr: "Generate QR", locale: "Language", viewMode: "View mode", compact: "Compact", detailed: "Detailed", install: "Install app", installHint: "Install on your device", privacy: "All data is stored locally on your device.", iosHint: "On iPhone: Safari → Share → Add to Home Screen" },
  onboarding: { step1title: "Import your calendar", step1desc: "Download .ics from your waste service.", step2title: "Track collections", step2desc: "See today, tomorrow and upcoming days.", step3title: "Enable reminders", step3desc: "Allow notifications in Settings.", next: "Next", finish: "Get started", skip: "Skip" },
  filters: { search: "Search address...", allAddresses: "All addresses", allTypes: "All types", clear: "Clear filters", dateFrom: "From", dateTo: "To" },
  common: { loading: "Loading", close: "Close", unknown: "Unknown", offline: "You are offline. Local data is available." },
};
