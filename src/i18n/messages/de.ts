import type { Messages } from "./pt-BR";

export const de: Messages = {
  appName: "Müllplaner",
  nav: { home: "Übersicht", calendar: "Kalender", history: "Verlauf", addresses: "Adressen", settings: "Einstellungen" },
  home: { subtitle: "Ihre Abholtermine", today: "Heute", tomorrow: "Morgen", upcoming: "Nächste Tage", noToday: "Heute keine Abholung", noTomorrow: "Morgen keine Abholung", welcome: "Willkommen beim Müllplaner!", welcomeHint: "Importieren Sie .ics-Dateien unter \"Adressen\".", noFilterResults: "Keine Termine für die Filter gefunden." },
  checkIn: { action: "Check-in", done: "Erledigt", undo: "Rückgängig", note: "Notiz (optional)", photo: "Foto (optional)", confirm: "Check-in bestätigen" },
  calendar: { title: "Kalender", subtitle: "Monatsübersicht" },
  history: { title: "Verlauf", subtitle: "Check-ins", empty: "Noch keine Check-ins", emptyHint: "Markieren Sie Abholungen in der Übersicht.", stats: "Statistiken", streak: "Aktuelle Serie", total: "Check-ins gesamt", thisMonth: "Diesen Monat", byType: "Nach Typ" },
  addresses: { title: "Adressen", subtitle: "ICS-Dateien verwalten", import: ".ics importieren", importWebcal: "Via URL (webcal)", empty: "Noch keine Adressen", collections: "Termine", reimport: "Neu importieren", edit: "Adresse bearbeiten", delete: "Adresse löschen?", save: "Speichern", cancel: "Abbrechen", deleteBtn: "Löschen", nameAddress: "Adresse benennen" },
  settings: { title: "Einstellungen", appearance: "Erscheinungsbild", themeLight: "Hell", themeDark: "Dunkel", themeSystem: "System", notifications: "Benachrichtigungen", enableNotif: "Aktivieren", allow: "Erlauben", dayBefore: "Am Vortag", dayOf: "Am Abholtag", evening: "Abends", eveningHint: "Wenn kein Check-in bis zu dieser Zeit", time: "Uhrzeit", testNotif: "Testbenachrichtigung", profiles: "Profile", addProfile: "Neues Profil", backup: "Backup", export: "Backup exportieren", import: "Backup importieren", qr: "QR-Code", locale: "Sprache", viewMode: "Ansicht", compact: "Kompakt", detailed: "Detailliert", install: "App installieren", installHint: "Auf Gerät installieren", privacy: "Alle Daten werden lokal gespeichert.", iosHint: "iPhone: Safari → Teilen → Zum Home-Bildschirm" },
  onboarding: { step1title: "Kalender importieren", step1desc: "Laden Sie die .ics-Datei Ihres Entsorgers hoch.", step2title: "Termine verfolgen", step2desc: "Heute, morgen und kommende Tage.", step3title: "Erinnerungen", step3desc: "Benachrichtigungen in Einstellungen aktivieren.", next: "Weiter", finish: "Starten", skip: "Überspringen" },
  filters: { search: "Adresse suchen...", allAddresses: "Alle Adressen", allTypes: "Alle Arten", clear: "Filter zurücksetzen", dateFrom: "Von", dateTo: "Bis" },
  common: { loading: "Laden", close: "Schließen", unknown: "Unbekannt", offline: "Offline. Lokale Daten verfügbar." },
};
