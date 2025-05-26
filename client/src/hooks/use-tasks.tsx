import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { telegram } from "@/lib/telegram";
import type { Task, UserTask } from "@shared/schema";

interface TasksResponse {
  tasks: Task[];
}

interface UserTasksResponse {
  userTasks: (UserTask & { task: Task })[];
}

interface StartTaskResponse {
  userTask: UserTask;
  actionUrl?: string;
}

interface CompleteTaskResponse {
  success: boolean;
  reward: number;
  message: string;
}

export function useTasks() {
  const queryClient = useQueryClient();
  const telegramUser = telegram.getUser();

  const tasksQuery = useQuery<TasksResponse>({
    queryKey: ['/api/tasks'],
  });

  const userTasksQuery = useQuery<UserTasksResponse>({
    queryKey: ['/api/user', telegramUser?.id, 'tasks'],
    enabled: !!telegramUser?.id,
  });

  const startTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      if (!telegramUser) throw new Error('No Telegram user');
      
      const res = await apiRequest('POST', '/api/tasks/start', {
        taskId,
        telegramId: telegramUser.id.toString(),
      });
      return await res.json() as StartTaskResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user', telegramUser?.id, 'tasks'] });
      telegram.hapticFeedback('success');
    },
    onError: () => {
      telegram.hapticFeedback('error');
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (userTaskId: number) => {
      if (!telegramUser) throw new Error('No Telegram user');
      
      const res = await apiRequest('POST', '/api/tasks/complete', {
        userTaskId,
        telegramId: telegramUser.id.toString(),
      });
      return await res.json() as CompleteTaskResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user', telegramUser?.id, 'tasks'] });
      telegram.hapticFeedback('success');
      
      // Show success popup
      telegram.showPopup(
        'Task Completed!',
        `You've earned ${data.reward} TOKENS!`,
        [{ text: 'Awesome!', type: 'ok' }]
      );
    },
    onError: () => {
      telegram.hapticFeedback('error');
    },
  });

  const getTaskStatus = (taskId: number): 'available' | 'pending' | 'completed' | 'verified' => {
    const userTask = userTasksQuery.data?.userTasks.find(ut => ut.taskId === taskId);
    if (!userTask) return 'available';
    return userTask.status as 'pending' | 'completed' | 'verified';
  };

  const getUserTaskId = (taskId: number): number | undefined => {
    const userTask = userTasksQuery.data?.userTasks.find(ut => ut.taskId === taskId);
    return userTask?.id;
  };

  const startTask = async (task: Task) => {
    const result = await startTaskMutation.mutateAsync(task.id);
    
    // Open action URL if available
    if (result.actionUrl) {
      telegram.openLink(result.actionUrl);
    }
    
    return result;
  };

  const completeTask = async (taskId: number) => {
    const userTaskId = getUserTaskId(taskId);
    if (!userTaskId) throw new Error('User task not found');
    
    return await completeTaskMutation.mutateAsync(userTaskId);
  };

  return {
    tasks: tasksQuery.data?.tasks || [],
    userTasks: userTasksQuery.data?.userTasks || [],
    isLoading: tasksQuery.isLoading || userTasksQuery.isLoading,
    isError: tasksQuery.isError || userTasksQuery.isError,
    error: tasksQuery.error || userTasksQuery.error,
    startTask,
    completeTask,
    getTaskStatus,
    getUserTaskId,
    isStartingTask: startTaskMutation.isPending,
    isCompletingTask: completeTaskMutation.isPending,
  };
}
