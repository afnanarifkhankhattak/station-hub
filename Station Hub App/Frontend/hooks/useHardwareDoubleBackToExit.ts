import { useCallback, useRef } from "react";
import { BackHandler, Platform, ToastAndroid } from "react-native";
import { router, useFocusEffect } from "expo-router";

const EXIT_WINDOW_MS = 2000;
const EXIT_HINT = "Press back again to exit";

type Options = {
  /**
   * When true (default), a single hardware back pops if router.canGoBack().
   * Set false on Home so leftover splash/auth history never reopens.
   */
  allowNavigateBack?: boolean;
};

/**
 * Hardware Android back only (not UI buttons).
 * While this screen is focused:
 *  - optional: pop if history exists
 *  - otherwise: double-press within 2s to exit
 * Unregisters when screen blurs so nested screens keep normal back.
 */
export function useHardwareDoubleBackToExit(options: Options = {}) {
  const allowNavigateBack = options.allowNavigateBack !== false;
  const lastPressAt = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") {
        return () => {};
      }

      lastPressAt.current = 0;

      const clearTimer = () => {
        if (resetTimer.current) {
          clearTimeout(resetTimer.current);
          resetTimer.current = null;
        }
      };

      const onHardwareBackPress = () => {
        if (allowNavigateBack && router.canGoBack()) {
          lastPressAt.current = 0;
          clearTimer();
          router.back();
          return true;
        }

        const now = Date.now();
        if (lastPressAt.current > 0 && now - lastPressAt.current < EXIT_WINDOW_MS) {
          lastPressAt.current = 0;
          clearTimer();
          BackHandler.exitApp();
          return true;
        }

        lastPressAt.current = now;
        ToastAndroid.show(EXIT_HINT, ToastAndroid.SHORT);
        clearTimer();
        resetTimer.current = setTimeout(() => {
          lastPressAt.current = 0;
          resetTimer.current = null;
        }, EXIT_WINDOW_MS);

        return true;
      };

      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onHardwareBackPress,
      );

      return () => {
        sub.remove();
        clearTimer();
        lastPressAt.current = 0;
      };
    }, [allowNavigateBack]),
  );
}
