import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL ?? "http://10.0.2.2:8080";

const config: CapacitorConfig = {
  appId: "hu.nosziii.speaky",
  appName: "Itt vagyok",
  webDir: "mobile-shell",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
  },
};

export default config;
