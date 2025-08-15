import { Users, UserCheck, Calendar, TrendingUp, Activity, Heart, Scan, Package } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { ActivityFeed } from './ActivityFeed';
import { AdminStats, AnalysisTrackingStats, ActivityFeedItem } from '../types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface AdminOverviewProps {
  stats: AdminStats;
  analysisStats?: AnalysisTrackingStats;
  activityFeed: ActivityFeedItem[];
  isLoading?: boolean;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  stats,
  analysisStats,
  activityFeed,
  isLoading,
}) => {
  if (isLoading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          description={`${stats.monthlyGrowth}% from last month`}
          trend={{ value: stats.monthlyGrowth, isPositive: stats.monthlyGrowth > 0 }}
        />
        <StatsCard
          title="Total Doctors"
          value={stats.totalDoctors}
          icon={UserCheck}
          description="Active medical staff"
        />
        <StatsCard
          title="Total Appointments"
          value={stats.totalAppointments}
          icon={Calendar}
          description={`${stats.pendingAppointments} pending`}
        />
        <StatsCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          icon={TrendingUp}
          description="Scheduled for today"
        />
      </div>

      {/* Analysis Tracking Stats */}
      {analysisStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Face Analyses"
            value={analysisStats.faceAnalyses}
            icon={Scan}
            className="bg-purple-50"
          />
          <StatsCard
            title="Hair Analyses"
            value={analysisStats.hairAnalyses}
            icon={Activity}
            className="bg-blue-50"
          />
          <StatsCard
            title="Skin Analyses"
            value={analysisStats.skinAnalyses}
            icon={Heart}
            className="bg-pink-50"
          />
          <StatsCard
            title="Lips Analyses"
            value={analysisStats.lipsAnalyses}
            icon={Heart}
            className="bg-red-50"
          />
          <StatsCard
            title="Total Analyses"
            value={analysisStats.totalAnalyses}
            icon={Package}
            description={`${analysisStats.growthPercentage}% growth`}
            trend={{ 
              value: analysisStats.growthPercentage, 
              isPositive: analysisStats.growthPercentage > 0 
            }}
          />
        </div>
      )}

      {/* Activity Feed and Additional Content */}
      <div className="grid gap-4 md:grid-cols-2">
        <ActivityFeed activities={activityFeed} />
        
        {/* Quick Actions or Additional Stats */}
        <div className="space-y-4">
          {/* Add more dashboard widgets here */}
        </div>
      </div>
    </div>
  );
};