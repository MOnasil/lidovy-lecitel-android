import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "cz.lidovylecitel.app",
  appName: "Lidový léčitel",
  webDir: "dist",
  android: { allowMixedContent: false },
};

export default config;
