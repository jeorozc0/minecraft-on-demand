// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "MinecraftOnDemand",
      removal: input?.stage === "prod" ? "retain" : "remove",
      protect: ["prod"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const apiId =
      new sst.Secret("NEXT_PUBLIC_API_ID", process.env.NEXT_PUBLIC_API_ID!)
    const siteUrl =
      new sst.Secret("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL!)
    const supabaseUrl =
      new sst.Secret("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL!);
    const supabaseAnonKey =
      new sst.Secret("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    new sst.aws.Nextjs("Website", {
      environment: {
        NEXT_PUBLIC_API_ID: apiId.value,
        NEXT_PUBLIC_SITE_URL: siteUrl.value,
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl.value,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey.value
      },
      transform: {
        server: {
          architecture: "arm64",
          memory: "1536 MB",
          timeout: "60 seconds",
        }
      }
    });
  },
});
