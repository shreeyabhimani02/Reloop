import { useQuery } from "@tanstack/react-query";
import { getPublicUser } from "../services/userService";

export function usePublicUser(userId: string) {
  return useQuery({
    queryKey: ["public-user", userId],
    queryFn: () => getPublicUser(userId),
    enabled: Boolean(userId),
  });
}