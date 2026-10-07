import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { expoConstants } = vi.hoisted(() => ({
  expoConstants: {
    expoConfig: { hostUri: undefined as string | undefined },
    expoGoConfig: { debuggerHost: undefined as string | undefined },
  },
}));

vi.mock("expo-constants", () => ({ default: expoConstants }));
vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));

describe("API_BASE", () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_API_PORT;
    expoConstants.expoConfig.hostUri = undefined;
    expoConstants.expoGoConfig.debuggerHost = undefined;
    vi.stubGlobal("__DEV__", false);
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("uses the configured API URL when provided", async () => {
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.test";
    expoConstants.expoConfig.hostUri = "192.168.1.10:8081";

    const { API_BASE } = await import("../src/config");

    expect(API_BASE).toBe("https://api.example.test");
  });

  it("uses the Expo host and configured port as the fallback", async () => {
    process.env.EXPO_PUBLIC_API_PORT = "8123";
    expoConstants.expoConfig.hostUri = "192.168.1.10:8081";

    const { API_BASE } = await import("../src/config");

    expect(API_BASE).toBe("http://192.168.1.10:8123");
  });
});