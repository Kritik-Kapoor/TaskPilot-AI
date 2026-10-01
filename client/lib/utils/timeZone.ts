export const getClientTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;
