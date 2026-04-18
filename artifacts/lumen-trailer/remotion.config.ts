import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(1);

const PUBLIC_PATH = process.env.REMOTION_PUBLIC_PATH || "/lumen-trailer/";

Config.overrideWebpackConfig((current) => {
  return {
    ...current,
    output: {
      ...(current.output ?? {}),
      publicPath: PUBLIC_PATH,
    },
  };
});
