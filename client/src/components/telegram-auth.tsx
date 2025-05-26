import { useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TelegramAuthProps {
  children: React.ReactNode;
}

export function TelegramAuth({ children }: TelegramAuthProps) {
  const { user, isLoading, isAuthenticated, authenticateUser, telegramUser } = useUser();

  useEffect(() => {
    if (telegramUser && !isAuthenticated && !isLoading) {
      authenticateUser().catch(console.error);
    }
  }, [telegramUser, isAuthenticated, isLoading, authenticateUser]);

  if (!telegramUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Telegram Required
              </h1>
              <p className="text-gray-600 text-sm mb-4">
                This app can only be used within Telegram. Please open it through the Telegram bot.
              </p>
            </div>
            <Button
              onClick={() => window.open('https://t.me/cryptoairdropbot', '_blank')}
              className="w-full telegram-blue"
            >
              Open in Telegram
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h3 className="font-semibold text-gray-800 mb-2">Setting up your account</h3>
            <p className="text-sm text-gray-500">Please wait while we prepare everything...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Authentication Failed
              </h1>
              <p className="text-gray-600 text-sm mb-4">
                We couldn't authenticate your account. Please try again.
              </p>
            </div>
            <Button
              onClick={() => authenticateUser()}
              className="w-full telegram-blue"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
