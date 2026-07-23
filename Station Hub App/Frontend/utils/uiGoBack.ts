import { router } from "expo-router";

/**
 * Header / UI back only — never exits the app.
 *
 * 1. If navigation history exists → pop previous screen
 * 2. If already at a tab root (opened via replace) → go Home
 */
export function uiGoBack() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  // Tab screens use router.replace, so there is often no stack to pop.
  router.replace("/(tabs)/Home/home" as any);
}
