import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Circle, 
  Star, 
  Trophy, 
  Target, 
  Gift,
  User,
  Calendar,
  Stethoscope,
  Heart,
  Award,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  points: number;
  action?: () => void;
  actionText?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface GamifiedOnboardingProps {
  userRole: 'patient' | 'doctor' | 'admin' | 'clinic';
  onStepComplete?: (stepId: string) => void;
  onComplete?: () => void;
}

export function GamifiedOnboarding({ userRole, onStepComplete, onComplete }: GamifiedOnboardingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // Define onboarding steps based on user role
  const getOnboardingSteps = (role: string): OnboardingStep[] => {
    const baseSteps = [
      {
        id: 'profile-setup',
        title: 'Complete Your Profile',
        description: 'Add your personal information and profile picture',
        icon: <User className="h-6 w-6" />,
        completed: false,
        points: 50,
        actionText: 'Update Profile'
      },
      {
        id: 'avatar-interaction',
        title: 'Meet Your AI Assistant',
        description: 'Have your first conversation with our AI healthcare assistant',
        icon: <Stethoscope className="h-6 w-6" />,
        completed: false,
        points: 100,
        actionText: 'Start Chat'
      }
    ];

    const roleSpecificSteps = {
      patient: [
        {
          id: 'book-appointment',
          title: 'Book Your First Appointment',
          description: 'Schedule a consultation with one of our doctors',
          icon: <Calendar className="h-6 w-6" />,
          completed: false,
          points: 75,
          actionText: 'Book Appointment'
        },
        {
          id: 'health-assessment',
          title: 'Complete Health Assessment',
          description: 'Take our comprehensive health questionnaire',
          icon: <Heart className="h-6 w-6" />,
          completed: false,
          points: 80,
          actionText: 'Start Assessment'
        }
      ],
      doctor: [
        {
          id: 'setup-schedule',
          title: 'Set Your Availability',
          description: 'Configure your working hours and appointment slots',
          icon: <Calendar className="h-6 w-6" />,
          completed: false,
          points: 75,
          actionText: 'Set Schedule'
        },
        {
          id: 'first-consultation',
          title: 'Complete First Consultation',
          description: 'Conduct your first patient consultation on the platform',
          icon: <Stethoscope className="h-6 w-6" />,
          completed: false,
          points: 150,
          actionText: 'View Patients'
        }
      ],
      admin: [
        {
          id: 'setup-clinic',
          title: 'Configure Clinic Settings',
          description: 'Set up your clinic information and preferences',
          icon: <Target className="h-6 w-6" />,
          completed: false,
          points: 100,
          actionText: 'Configure'
        },
        {
          id: 'add-doctors',
          title: 'Add Medical Staff',
          description: 'Invite doctors and staff to join your clinic',
          icon: <User className="h-6 w-6" />,
          completed: false,
          points: 120,
          actionText: 'Manage Staff'
        }
      ],
      clinic: [
        {
          id: 'setup-clinic',
          title: 'Configure Clinic Settings',
          description: 'Set up your clinic information and preferences',
          icon: <Target className="h-6 w-6" />,
          completed: false,
          points: 100,
          actionText: 'Configure'
        }
      ]
    };

    return [...baseSteps, ...(roleSpecificSteps[role as keyof typeof roleSpecificSteps] || [])];
  };

  const [steps, setSteps] = useState<OnboardingStep[]>(getOnboardingSteps(userRole));

  // Define achievements
  const achievements: Achievement[] = [
    {
      id: 'first-steps',
      title: 'First Steps',
      description: 'Complete your first onboarding step',
      icon: <Star className="h-5 w-5" />,
      unlocked: false,
      points: 25,
      rarity: 'common'
    },
    {
      id: 'profile-master',
      title: 'Profile Master',
      description: 'Complete your profile setup',
      icon: <User className="h-5 w-5" />,
      unlocked: false,
      points: 50,
      rarity: 'common'
    },
    {
      id: 'ai-whisperer',
      title: 'AI Whisperer',
      description: 'Have your first conversation with the AI assistant',
      icon: <Zap className="h-5 w-5" />,
      unlocked: false,
      points: 75,
      rarity: 'rare'
    },
    {
      id: 'completion-champion',
      title: 'Completion Champion',
      description: 'Complete all onboarding steps',
      icon: <Trophy className="h-5 w-5" />,
      unlocked: false,
      points: 200,
      rarity: 'epic'
    },
    {
      id: 'perfect-start',
      title: 'Perfect Start',
      description: 'Complete onboarding in under 10 minutes',
      icon: <Award className="h-5 w-5" />,
      unlocked: false,
      points: 300,
      rarity: 'legendary'
    }
  ];

  const [availableAchievements, setAvailableAchievements] = useState(achievements);

  const completeStep = (stepId: string) => {
    setSteps(prev => prev.map(step => {
      if (step.id === stepId && !step.completed) {
        const updatedStep = { ...step, completed: true };
        setTotalPoints(current => current + step.points);
        checkAchievements(stepId);
        onStepComplete?.(stepId);
        
        // Show celebration animation
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
        
        return updatedStep;
      }
      return step;
    }));

    // Move to next step
    const completedSteps = steps.filter(step => step.completed).length + 1;
    if (completedSteps < steps.length) {
      setCurrentStepIndex(completedSteps);
    } else {
      // All steps completed
      onComplete?.();
    }
  };

  const checkAchievements = (completedStepId: string) => {
    const completedSteps = steps.filter(step => step.completed).length + 1;
    
    // First Steps achievement
    if (completedSteps === 1 && !unlockedAchievements.includes('first-steps')) {
      unlockAchievement('first-steps');
    }
    
    // Profile Master achievement
    if (completedStepId === 'profile-setup' && !unlockedAchievements.includes('profile-master')) {
      unlockAchievement('profile-master');
    }
    
    // AI Whisperer achievement
    if (completedStepId === 'avatar-interaction' && !unlockedAchievements.includes('ai-whisperer')) {
      unlockAchievement('ai-whisperer');
    }
    
    // Completion Champion achievement
    if (completedSteps === steps.length && !unlockedAchievements.includes('completion-champion')) {
      unlockAchievement('completion-champion');
    }
  };

  const unlockAchievement = (achievementId: string) => {
    setUnlockedAchievements(prev => [...prev, achievementId]);
    const achievement = availableAchievements.find(a => a.id === achievementId);
    if (achievement) {
      setTotalPoints(current => current + achievement.points);
      setAvailableAchievements(prev => 
        prev.map(a => a.id === achievementId ? { ...a, unlocked: true } : a)
      );
    }
  };

  const progress = (steps.filter(step => step.completed).length / steps.length) * 100;
  const currentStep = steps[currentStepIndex];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-blue-600">Welcome to MedCor!</CardTitle>
              <p className="text-gray-600 mt-1">Let's get you started with a quick setup</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalPoints}</div>
                <div className="text-sm text-gray-500">Points</div>
              </div>
              <Gift className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Onboarding Steps */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold">Getting Started Steps</h3>
          {steps.map((step, index) => (
            <Card 
              key={step.id} 
              className={cn(
                "transition-all duration-300",
                step.completed ? "bg-green-50 border-green-200" : 
                index === currentStepIndex ? "bg-blue-50 border-blue-200 shadow-md" : 
                "bg-gray-50 border-gray-200"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
                    step.completed ? "bg-green-500 text-white" :
                    index === currentStepIndex ? "bg-blue-500 text-white" :
                    "bg-gray-300 text-gray-600"
                  )}>
                    {step.completed ? <CheckCircle className="h-6 w-6" /> : step.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                    <div className="flex items-center mt-2 space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        +{step.points} points
                      </Badge>
                      {step.completed && (
                        <Badge className="text-xs bg-green-100 text-green-800">
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!step.completed && index === currentStepIndex && (
                    <Button 
                      onClick={() => completeStep(step.id)}
                      className="flex-shrink-0"
                    >
                      {step.actionText || 'Complete'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Achievements Sidebar */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Achievements</h3>
          <div className="space-y-3">
            {availableAchievements.map((achievement) => (
              <Card 
                key={achievement.id}
                className={cn(
                  "transition-all duration-300",
                  achievement.unlocked ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"
                )}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                      achievement.unlocked ? "bg-yellow-500 text-white" : "bg-gray-300 text-gray-600"
                    )}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm truncate">{achievement.title}</h5>
                      <p className="text-xs text-gray-600 line-clamp-2">{achievement.description}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", getRarityColor(achievement.rarity))}
                        >
                          {achievement.rarity}
                        </Badge>
                        <span className="text-xs text-gray-500">+{achievement.points}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce">
            <div className="bg-yellow-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span className="font-semibold">Great job! +{currentStep?.points} points</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}