// iOS public beta ticker settings.
//
// IOS_BETA_URL: the public TestFlight invite link. It opens in a new tab.
// If it is set to "", the ticker is still shown but is not a link.
export const IOS_BETA_URL = "https://testflight.apple.com/join/xSx8TBzQ";

// Bump the version to show the ticker again to users who dismissed it.
export const IOS_BETA_TICKER_DISMISS_KEY = "iosBetaTickerDismissed:v1";

// Set to false to turn the ticker off without removing it.
export const IOS_BETA_TICKER_ENABLED = true;

export const IOS_BETA_TICKER_ITEMS = [
  "UltiMafia for iOS is in PUBLIC BETA",
  "Play on iPhone and iPad",
  "Join the beta today",
];
