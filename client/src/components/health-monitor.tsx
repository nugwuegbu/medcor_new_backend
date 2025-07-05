import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Info, RefreshCw, Activity, Database, Brain, Cpu } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";

interface HealthData {
  status: string;
  health: {
    database: {
      healthy: boolean;
      lastCheck: string;
      connectionCount: number;
      errorCount: number;
    };
    avatar: {
      healthy: boolean;
      sessionActive: boolean;
      lastError?: string;
      errorCount: number;
    };
    api: {
      responseTime: number;
      errorRate: number;
      lastError?: string;
    };
    memory: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
    uptime: number;
  };
  recentIssues: Array<{
    type: string;
    severity: string;
    description: string;
    timestamp: string;
    autoFixed?: boolean;
    fixAttempts?: number;
  }>;
  timestamp: string;
}

export default function HealthMonitor() {
  const [showLogs, setShowLogs] = useState(false);
  
  const { data: healthData, isLoading, refetch } = useQuery<HealthData>({
    queryKey: ['/api/health'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  const { data: logsData } = useQuery<{ logs: string[] }>({
    queryKey: ['/api/health/logs'],
    enabled: showLogs,
  });
  
  const simulateMutation = useMutation({
    mutationFn: async (params: { type: string; description: string }) => {
      const response = await fetch('/api/health/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to simulate issue');
      return response.json();
    },
    onSuccess: () => {
      refetch();
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }
  
  if (!healthData) {
    return null;
  }
  
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };
  
  const formatBytes = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };
  
  const getStatusIcon = (healthy: boolean) => {
    return healthy ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-500" />
    );
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">System Health Monitor</h2>
        <Button onClick={() => refetch()} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Status</span>
              {getStatusIcon(healthData.health.database.healthy)}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Connections: {healthData.health.database.connectionCount}</p>
              <p>Errors: {healthData.health.database.errorCount}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Avatar Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Avatar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Status</span>
              {getStatusIcon(healthData.health.avatar.healthy)}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Session: {healthData.health.avatar.sessionActive ? 'Active' : 'Inactive'}</p>
              <p>Errors: {healthData.health.avatar.errorCount}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* API Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Response</span>
              <span className="text-sm font-medium">{healthData.health.api.responseTime}ms</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Error Rate: {(healthData.health.api.errorRate * 100).toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Memory Usage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Heap</span>
              <span className="text-sm font-medium">
                {formatBytes(healthData.health.memory.heapUsed)} / {formatBytes(healthData.health.memory.heapTotal)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>RSS: {formatBytes(healthData.health.memory.rss)}</p>
              <p>Uptime: {formatUptime(healthData.health.uptime)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Issues */}
      {healthData.recentIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData.recentIssues.map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(issue.severity)}>
                        {issue.severity}
                      </Badge>
                      <Badge variant="outline">{issue.type}</Badge>
                      {issue.autoFixed && (
                        <Badge variant="default" className="bg-green-500">
                          Auto-fixed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(issue.timestamp).toLocaleString()}
                      {issue.fixAttempts && ` • ${issue.fixAttempts} fix attempts`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test Self-Healing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateMutation.mutate({ 
                type: 'database', 
                description: 'Simulated database connection failure' 
              })}
            >
              Test DB Failure
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateMutation.mutate({ 
                type: 'avatar', 
                description: 'Simulated avatar session error' 
              })}
            >
              Test Avatar Error
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateMutation.mutate({ 
                type: 'memory', 
                description: 'Simulated high memory usage' 
              })}
            >
              Test Memory Issue
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLogs(!showLogs)}
            >
              {showLogs ? 'Hide' : 'Show'} Logs
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Logs Display */}
      {showLogs && logsData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
              {logsData.logs.map((log: string, index: number) => (
                <div key={index} className="whitespace-pre-wrap break-all">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}