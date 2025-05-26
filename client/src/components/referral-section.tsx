import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Users, Gift } from "lucide-react";
import { telegram } from "@/lib/telegram";
import { useUser } from "@/hooks/use-user";
import type { Referral, User } from "@shared/schema";

interface ReferralData {
  referrals: (Referral & { referred: User })[];
  stats: {
    count: number;
    totalEarned: number;
  };
  referralLink: string;
}

export function ReferralSection() {
  const { user } = useUser();
  const telegramUser = telegram.getUser();
  
  const referralsQuery = useQuery<ReferralData>({
    queryKey: ['/api/user', telegramUser?.id, 'referrals'],
    enabled: !!telegramUser?.id,
  });

  const handleShare = () => {
    if (referralsQuery.data?.referralLink) {
      telegram.hapticFeedback('selection');
      
      if (navigator.share) {
        navigator.share({
          title: 'Join CryptoAirdrop Bot',
          text: 'Earn crypto tokens by completing simple tasks! 🚀',
          url: referralsQuery.data.referralLink,
        }).catch(console.error);
      } else {
        // Fallback for environments without native sharing
        navigator.clipboard.writeText(referralsQuery.data.referralLink).then(() => {
          telegram.showPopup(
            'Link Copied!', 
            'Your referral link has been copied to clipboard. Share it with your friends!',
            [{ text: 'OK', type: 'ok' }]
          );
        }).catch(() => {
          // If clipboard fails, show the link
          telegram.showPopup(
            'Your Referral Link',
            referralsQuery.data.referralLink,
            [{ text: 'OK', type: 'ok' }]
          );
        });
      }
    }
  };

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

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const referralDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - referralDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  if (referralsQuery.isLoading) {
    return (
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Referral Program</h3>
        <div className="loading-skeleton h-32 rounded-2xl mb-4"></div>
        <div className="loading-skeleton h-24 rounded-2xl"></div>
      </section>
    );
  }

  const { stats = { count: 0, totalEarned: 0 }, referrals = [] } = referralsQuery.data || {};

  return (
    <section className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Referral Program</h3>
      
      {/* Referral Stats Card */}
      <Card className="mb-4 overflow-hidden">
        <CardContent className="p-0">
          <div className="telegram-gradient p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold flex items-center">
                  <Gift className="h-5 w-5 mr-2" />
                  Invite Friends
                </h4>
                <p className="text-white/80 text-sm">Earn 20% of their rewards</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{stats.count}</p>
                <p className="text-xs text-white/80">Friends invited</p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-white/80 mb-1">
                <span>Total earned from referrals</span>
                <span>{stats.totalEarned} TOKENS</span>
              </div>
            </div>
            
            <Button
              onClick={handleShare}
              variant="secondary"
              className="w-full bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Referral Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card>
        <CardContent className="p-4">
          <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Recent Referrals
          </h5>
          
          {referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.slice(0, 5).map((referral) => (
                <div key={referral.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {getInitials(referral.referred.firstName, referral.referred.lastName, referral.referred.username)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {referral.referred.firstName || referral.referred.username}
                        {referral.referred.lastName && ` ${referral.referred.lastName}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(referral.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="text-green-500 text-sm font-medium">
                    +{referral.rewardEarned} TOKENS
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-2">No referrals yet</p>
              <p className="text-gray-400 text-xs">
                Share your referral link to start earning bonus rewards!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
