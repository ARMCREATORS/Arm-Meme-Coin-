import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { telegram } from "@/lib/telegram";
import type { User } from "@shared/schema";

interface UserProfile {
  user: User & { rank: number };
  referralStats: {
    count: number;
    totalEarned: number;
  };
}

interface AuthResponse {
  user: User;
}

export function useUser() {
  const queryClient = useQueryClient();
  const telegramUser = telegram.getUser();
  
  const userQuery = useQuery<UserProfile>({
    queryKey: ['/api/user', telegramUser?.id],
    enabled: !!telegramUser?.id,
  });

  const authMutation = useMutation({
    mutationFn: async (authData: {
      telegramId: string;
      username: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      referralCode?: string;
    }) => {
      const res = await apiRequest('POST', '/api/auth/telegram', authData);
      return await res.json() as AuthResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
  });

  const authenticateUser = async () => {
    if (!telegramUser) {
      throw new Error('No Telegram user data available');
    }

    const startParam = telegram.getStartParam();
    const referralCode = startParam ? startParam : undefined;

    await authMutation.mutateAsync({
      telegramId: telegramUser.id.toString(),
      username: telegramUser.username || `user_${telegramUser.id}`,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      avatarUrl: telegramUser.photo_url,
      referralCode,
    });
  };

  return {
    user: userQuery.data?.user,
    referralStats: userQuery.data?.referralStats,
    isLoading: userQuery.isLoading || authMutation.isPending,
    isError: userQuery.isError || authMutation.isError,
    error: userQuery.error || authMutation.error,
    authenticateUser,
    isAuthenticated: !!userQuery.data?.user,
    telegramUser,
  };
}
