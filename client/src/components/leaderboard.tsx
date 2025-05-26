import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import type { User } from "@shared/schema";

interface LeaderboardData {
  leaderboard: User[];
}

export function Leaderboard() {
  const { user } = useUser();
  
  const leaderboardQuery = useQuery<LeaderboardData>({
    queryKey: ['/api/leaderboard'],
  });

  const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.username;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-lg">🥇</span>;
      case 2:
        return <span className="text-lg">🥈</span>;
      case 3:
        return <span className="text-lg">🥉</span>;
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center">
            <span className="font-bold text-gray-600 text-sm">#{rank}</span>
          </div>
        );
    }
  };

  const getAvatarColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-700';
      case 2:
        return 'bg-gray-100 text-gray-700';
      case 3:
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  if (leaderboardQuery.isLoading) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Leaderboard</h3>
          <span className="text-sm text-blue-500 font-medium">View all</span>
        </div>
        <div className="loading-skeleton h-64 rounded-2xl mb-4"></div>
        <div className="loading-skeleton h-20 rounded-xl"></div>
      </section>
    );
  }

  const leaderboard = leaderboardQuery.data?.leaderboard || [];
  const topUsers = leaderboard.slice(0, 10);
  const currentUserRank = user?.rank || 0;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
          Leaderboard
        </h3>
        <Badge variant="secondary" className="text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />
          Top {topUsers.length}
        </Badge>
      </div>

      <Card className="overflow-hidden mb-4">
        <CardContent className="p-0">
          {topUsers.map((leaderUser, index) => {
            const rank = index + 1;
            const isCurrentUser = user && leaderUser.id === user.id;
            
            return (
              <div
                key={leaderUser.id}
                className={`flex items-center justify-between p-4 border-b border-gray-50 last:border-b-0 ${
                  isCurrentUser ? 'bg-blue-50 border-blue-100' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getRankIcon(rank)}
                  <div className={`w-10 h-10 ${getAvatarColor(rank)} rounded-full flex items-center justify-center`}>
                    <span className="font-medium text-sm">
                      {getInitials(leaderUser.firstName, leaderUser.lastName, leaderUser.username)}
                    </span>
                  </div>
                  <div>
                    <p className={`font-semibold ${isCurrentUser ? 'text-blue-700' : 'text-gray-800'}`}>
                      {getDisplayName(leaderUser)}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-blue-600 font-normal">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Medal className="h-3 w-3 mr-1" />
                      Level {leaderUser.level}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">
                    {leaderUser.totalEarned.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">tokens</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Current User Rank (if not in top 10) */}
      {user && currentUserRank > 10 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <span className="font-bold text-blue-600 text-sm">#{currentUserRank}</span>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="font-medium text-white text-sm">
                    {getInitials(user.firstName, user.lastName, user.username)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-blue-800">You</p>
                  <p className="text-xs text-blue-600 flex items-center">
                    <Medal className="h-3 w-3 mr-1" />
                    Level {user.level}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">
                  {user.totalEarned.toLocaleString()}
                </p>
                <p className="text-xs text-blue-500">tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
