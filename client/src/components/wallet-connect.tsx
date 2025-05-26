import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, CheckCircle } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { telegram } from "@/lib/telegram";

export function WalletConnect() {
  const { user } = useUser();
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();
  const telegramUser = telegram.getUser();

  const walletMutation = useMutation({
    mutationFn: async (tonWallet: string) => {
      if (!telegramUser) throw new Error('No Telegram user');
      
      const res = await apiRequest('POST', '/api/user/wallet', {
        telegramId: telegramUser.id.toString(),
        tonWallet,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      telegram.hapticFeedback('success');
      telegram.showPopup(
        'Wallet Connected!',
        'Your TONKeeper wallet has been connected successfully. You earned 200 ARM tokens!',
        [{ text: 'Awesome!', type: 'ok' }]
      );
    },
    onError: () => {
      telegram.hapticFeedback('error');
      setIsConnecting(false);
    },
  });

  const handleConnectWallet = () => {
    setIsConnecting(true);
    telegram.hapticFeedback('medium');
    
    // Open TONKeeper deep link
    const tonkeeperUrl = `tonkeeper://`;
    const fallbackUrl = `https://tonkeeper.com/`;
    
    // Try to open TONKeeper app first
    window.location.href = tonkeeperUrl;
    
    // Fallback to web version after a short delay
    setTimeout(() => {
      window.open(fallbackUrl, '_blank');
    }, 1000);
    
    // Simulate wallet connection for demo (in real app, this would come from TONKeeper)
    setTimeout(() => {
      const demoWalletAddress = `EQ${Math.random().toString(36).substring(2, 15)}...${Math.random().toString(36).substring(2, 6)}`;
      walletMutation.mutate(demoWalletAddress);
      setIsConnecting(false);
    }, 3000);
  };

  const isWalletConnected = user?.tonWallet;

  return (
    <Card className="mb-6 overflow-hidden border-2 border-cyan-200 bg-gradient-to-r from-cyan-50 to-purple-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 flex items-center">
                <Wallet className="h-4 w-4 mr-2" />
                TONKeeper Wallet
              </h4>
              {isWalletConnected ? (
                <p className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected: {user.tonWallet?.substring(0, 8)}...
                </p>
              ) : (
                <p className="text-sm text-gray-600">Connect to earn 200 ARM tokens</p>
              )}
            </div>
          </div>
          
          <div className="text-right">
            {isWalletConnected ? (
              <div className="text-green-600">
                <CheckCircle className="h-8 w-8 mx-auto mb-1" />
                <p className="text-xs font-medium">Connected</p>
              </div>
            ) : (
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting || walletMutation.isPending}
                className="arm-primary flex items-center space-x-2"
                size="sm"
              >
                {isConnecting || walletMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    <span>Connect</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        
        {!isWalletConnected && (
          <div className="mt-4 p-3 bg-white/50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              🚀 Connect your TONKeeper wallet to manage your ARM tokens and participate in the ecosystem
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}