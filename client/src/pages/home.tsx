import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Coins, Zap, Gift, Star } from "lucide-react";
import { TaskCard } from "@/components/task-card";
import { ReferralSection } from "@/components/referral-section";
import { Leaderboard } from "@/components/leaderboard";
import { TabNavigation } from "@/components/tab-navigation";
import { useUser } from "@/hooks/use-user";
import { useTasks } from "@/hooks/use-tasks";
import { telegram } from "@/lib/telegram";

export default function Home() {
  const [activeTab, setActiveTab] = useState('tasks');
  const { user, referralStats } = useUser();
  const { 
    tasks, 
    startTask, 
    completeTask, 
    getTaskStatus, 
    isStartingTask, 
    isCompletingTask 
  } = useTasks();

  useEffect(() => {
    // Set up Telegram Web App
    if (telegram.isAvailable()) {
      telegram.hapticFeedback('light');
    }
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 18) return 'Good afternoon!';
    return 'Good evening!';
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return user?.username || 'User';
  };

  const getProgressToNextLevel = () => {
    if (!user) return { current: 0, target: 1000, percentage: 0 };
    
    const currentLevelMin = (user.level - 1) * 1000;
    const nextLevelMin = user.level * 1000;
    const progress = user.totalEarned - currentLevelMin;
    const target = nextLevelMin - currentLevelMin;
    const percentage = Math.min((progress / target) * 100, 100);
    
    return { current: progress, target, percentage };
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.substring(0, 2).toUpperCase();
    }
    return user?.username?.substring(0, 2).toUpperCase() || 'U';
  };

  const handleQuickEarn = () => {
    telegram.hapticFeedback('medium');
    setActiveTab('tasks');
  };

  const progressInfo = getProgressToNextLevel();
  const availableTasks = tasks.filter(task => getTaskStatus(task.id) === 'available');
  const completedTasksCount = tasks.filter(task => getTaskStatus(task.id) === 'verified').length;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <>
            {/* Welcome Card */}
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="telegram-gradient p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{getGreeting()}</h2>
                      <p className="text-white/80">{getDisplayName()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/80">Total Earned</p>
                      <p className="text-2xl font-bold">{user?.totalEarned?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <Progress 
                      value={progressInfo.percentage} 
                      className="h-2 bg-white/20"
                    />
                  </div>
                  <p className="text-xs text-white/80">
                    Level {user?.level || 1} • {progressInfo.current}/{progressInfo.target} to next level
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <Coins className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-800">{user?.balance?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">Current Balance</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Star className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-800">{completedTasksCount}</p>
                  <p className="text-xs text-gray-500">Tasks Completed</p>
                </CardContent>
              </Card>
            </div>

            {/* Available Tasks */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Available Tasks</h3>
                {availableTasks.length > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    +{availableTasks.length} new
                  </Badge>
                )}
              </div>

              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      status={getTaskStatus(task.id)}
                      onStart={startTask}
                      onComplete={completeTask}
                      isStarting={isStartingTask}
                      isCompleting={isCompletingTask}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Gift className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-2">No tasks available</p>
                    <p className="text-gray-400 text-xs">Check back later for new earning opportunities!</p>
                  </CardContent>
                </Card>
              )}
            </section>
          </>
        );

      case 'referrals':
        return <ReferralSection />;

      case 'leaderboard':
        return <Leaderboard />;

      case 'profile':
        return (
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile</h3>
            
            <Card className="mb-4">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">{getUserInitials()}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">{getDisplayName()}</h2>
                <p className="text-gray-500 text-sm mb-4">@{user?.username}</p>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-600">{user?.level || 1}</p>
                    <p className="text-xs text-gray-500">Level</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{user?.rank || 0}</p>
                    <p className="text-xs text-gray-500">Rank</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-purple-600">{referralStats?.count || 0}</p>
                    <p className="text-xs text-gray-500">Referrals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Account Stats</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Balance</span>
                    <span className="font-medium">{user?.balance?.toLocaleString() || 0} TOKENS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Earned</span>
                    <span className="font-medium">{user?.totalEarned?.toLocaleString() || 0} TOKENS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Referral Earnings</span>
                    <span className="font-medium">{referralStats?.totalEarned || 0} TOKENS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-medium">
                      {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl telegram-webapp">
      {/* Header */}
      <header className="telegram-blue text-white p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Coins className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AirdropBot</h1>
            <p className="text-xs opacity-80">Earn crypto rewards</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="bg-white/20 px-3 py-1 rounded-full">
            <span className="text-sm font-medium">{user?.balance?.toLocaleString() || 0}</span>
            <span className="text-xs ml-1">TOKENS</span>
          </div>
          
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">{getUserInitials()}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 px-4 pt-4">
        {renderTabContent()}
      </main>

      {/* Quick Earn Button */}
      <Button
        onClick={handleQuickEarn}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg telegram-blue animate-bounce-slow z-40"
        size="icon"
      >
        <Zap className="h-6 w-6" />
      </Button>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
