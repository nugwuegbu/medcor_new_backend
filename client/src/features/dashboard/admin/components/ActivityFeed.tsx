import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ActivityFeedItem } from '../types';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  className?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  className,
}) => {
  const getBadgeVariant = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'green': return 'default';
      case 'blue': return 'secondary';
      case 'yellow': return 'outline';
      case 'red': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              activities
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <Badge variant={getBadgeVariant(activity.type)} className="mt-1">
                      {activity.type === 'green' && '✓'}
                      {activity.type === 'blue' && '●'}
                      {activity.type === 'yellow' && '!'}
                      {activity.type === 'red' && '✗'}
                    </Badge>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};