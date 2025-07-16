import { useQuery } from "@tanstack/react-query";

const fetchMinecraftVersions = async (): Promise<string[]> => {
  const response = await fetch("https://mc-versions-api.net/api/java");

  if (!response.ok) {
    throw new Error("Failed to fetch Minecraft versions");
  }

  const data = await response.json();
  return data.result;
};

export const useMinecraftVersions = () => {
  return useQuery({
    queryKey: ["minecraftVersions"],
    queryFn: fetchMinecraftVersions,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};
