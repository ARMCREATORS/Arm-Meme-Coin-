import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, ExternalLink } from "lucide-react";
import type { Task } from "@shared/schema";

interface TaskCardProps {
  task: Task;
  status: 'available' | 'pending' | 'completed' | 'verified';
  onStart: (task: Task) => void;
  onComplete: (taskId: number) => void;
  isStarting?: boolean;
  isCompleting?: boolean;
}

export function TaskCard({ 
  task, 
  status, 
  onStart, 
  onComplete, 
  isStarting = false, 
  isCompleting = false 
}: TaskCardProps) {
  const getIconColor = () => {
    switch (task.category) {
      case 'twitter': return 'text-blue-500';
      case 'youtube': return 'text-red-500';
      case 'telegram': return 'text-blue-500';
      case 'daily': return 'text-orange-500';
      case 'referral': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getBackgroundColor = () => {
    switch (task.category) {
      case 'twitter': return 'bg-blue-100';
      case 'youtube': return 'bg-red-100';
      case 'telegram': return 'bg-blue-100';
      case 'daily': return 'bg-orange-100';
      case 'referral': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };

  const getButtonConfig = () => {
    switch (status) {
      case 'available':
        return {
          text: 'Start',
          variant: 'default' as const,
          onClick: () => onStart(task),
          disabled: isStarting,
          icon: isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : null,
        };
      case 'pending':
        return {
          text: 'Verify',
          variant: 'default' as const,
          onClick: () => onComplete(task.id),
          disabled: isCompleting,
          icon: isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />,
        };
      case 'completed':
        return {
          text: 'Verify',
          variant: 'default' as const,
          onClick: () => onComplete(task.id),
          disabled: isCompleting,
          icon: isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />,
        };
      case 'verified':
        return {
          text: 'Completed',
          variant: 'secondary' as const,
          onClick: () => {},
          disabled: true,
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <Card className="mb-3 border border-gray-100 dark:border-gray-700 dark:bg-card shadow-sm hover:shadow-md dark:hover:shadow-cyan-500/20 transition-all duration-300 glass-effect">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 ${getBackgroundColor()} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <i className={`${task.icon} ${getIconColor()} text-xl`}></i>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 dark:text-white truncate">{task.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{task.description}</p>
                
                <div className="flex items-center mt-2 space-x-2">
                  <Badge variant="secondary" className="text-xs font-medium bg-cyan-50 text-cyan-700">
                    +{task.reward} ARM
                  </Badge>
                  
                  {task.type === 'daily' && (
                    <Badge variant="outline" className="text-xs">
                      Daily
                    </Badge>
                  )}
                  
                  {task.type === 'referral' && (
                    <Badge variant="outline" className="text-xs">
                      High Reward
                    </Badge>
                  )}
                  
                  {status === 'verified' && (
                    <Badge className="text-xs bg-green-100 text-green-700">
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button
                size="sm"
                variant={buttonConfig.variant}
                onClick={buttonConfig.onClick}
                disabled={buttonConfig.disabled}
                className={`ml-3 flex-shrink-0 ${
                  status === 'available' || status === 'pending' || status === 'completed' 
                    ? 'arm-primary' 
                    : ''
                }`}
              >
                {buttonConfig.icon && (
                  <span className="mr-1">{buttonConfig.icon}</span>
                )}
                {buttonConfig.text}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
