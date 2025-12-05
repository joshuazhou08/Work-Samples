export const TIMEZONE_CHOICES = [
  { id: "America/New_York", label: "Eastern (EST)" },
  { id: "America/Chicago", label: "Central (CST)" },
  { id: "America/Denver", label: "Mountain (MST)" },
  { id: "America/Los_Angeles", label: "Pacific (PST)" },
  { id: "America/Anchorage", label: "Alaska (AKST)" },
  { id: "Pacific/Honolulu", label: "Hawaii-Aleutian (HST)" },
];

export const TIMEZONE_OPTIONS = TIMEZONE_CHOICES.map((tz) => tz.id);

export const TIMEZONE_SET: Set<string> = new Set(TIMEZONE_OPTIONS);

export const formatTimezoneLabel = (timeZone: string): string => {
  const match = TIMEZONE_CHOICES.find((option) => option.id === timeZone);
  return match ? match.label : timeZone;
};

export const getLocalTimezone = (): string => {
  try {
    if (typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function") {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && TIMEZONE_SET.has(tz)) {
        return tz;
      }
    }
  } catch {
    // ignore
  }

  return "America/Los_Angeles";
};
