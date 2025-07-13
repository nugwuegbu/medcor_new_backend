import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Sparkles, Heart, Sun, Moon, Droplets } from 'lucide-react';

interface SkincareTip {
  id: string;
  title: string;
  content: string;
  category: 'morning' | 'evening' | 'hydration' | 'protection' | 'treatment';
  duration: string;
  audioText: string;
}

interface VoiceSkincareWidgetProps {
  onClose: () => void;
}

const skincareTips: SkincareTip[] = [
  {
    id: 'morning-routine',
    title: 'Morning Skincare Routine',
    category: 'morning',
    duration: '2 min',
    content: 'Start your day with a gentle cleanser, followed by vitamin C serum, moisturizer, and broad-spectrum SPF 30+. This routine protects against environmental damage and keeps your skin hydrated throughout the day.',
    audioText: 'Good morning! Let\'s start your day with a perfect skincare routine. Begin with a gentle cleanser to remove overnight impurities. Next, apply a vitamin C serum to brighten and protect your skin. Follow with a lightweight moisturizer to lock in hydration. Finally, never forget your sunscreen - use broad-spectrum SPF 30 or higher to shield your skin from harmful UV rays. This routine takes just 5 minutes but gives you all-day protection and radiance.'
  },
  {
    id: 'evening-routine',
    title: 'Evening Skincare Routine',
    category: 'evening',
    duration: '3 min',
    content: 'Your evening routine should focus on repair and rejuvenation. Double cleanse, use a retinol or AHA product, apply a nourishing night moisturizer, and don\'t forget eye cream for the delicate under-eye area.',
    audioText: 'As the day winds down, it\'s time to focus on skin repair and renewal. Start with a double cleanse - first with an oil-based cleanser to remove makeup and sunscreen, then with a water-based cleanser for a deep clean. Apply a retinol serum or AHA treatment to promote cell turnover and smooth skin texture. Follow with a rich night moisturizer packed with hydrating ingredients like hyaluronic acid and ceramides. Don\'t forget the delicate eye area - use a specialized eye cream to address fine lines and dark circles. Your skin does its best repair work while you sleep, so give it the nutrients it needs.'
  },
  {
    id: 'hydration-tips',
    title: 'Hydration Essentials',
    category: 'hydration',
    duration: '1.5 min',
    content: 'Hydration is key to healthy skin. Use products with hyaluronic acid, drink plenty of water, and consider a humidifier in dry environments. Layer lightweight, water-based products for maximum absorption.',
    audioText: 'Hydration is the foundation of healthy, glowing skin. Look for products containing hyaluronic acid, which can hold up to 1000 times its weight in water. Apply serums to damp skin for better absorption. Don\'t forget to hydrate from within - drink at least 8 glasses of water daily. In dry climates or during winter, use a humidifier to add moisture to the air. Layer your products from thinnest to thickest consistency, allowing each layer to absorb before applying the next. Your skin will thank you with a plump, dewy appearance.'
  },
  {
    id: 'sun-protection',
    title: 'Sun Protection Guide',
    category: 'protection',
    duration: '2 min',
    content: 'Sun protection is crucial year-round. Use SPF 30+ daily, reapply every 2 hours, wear protective clothing, and seek shade during peak UV hours (10 AM - 4 PM). Remember, UV rays penetrate clouds and windows.',
    audioText: 'Sun protection is your skin\'s best friend and should be part of your daily routine, rain or shine. Choose a broad-spectrum sunscreen with at least SPF 30 and apply it generously 15 minutes before sun exposure. Reapply every 2 hours, or immediately after swimming or sweating. Remember, UV rays can penetrate clouds and reflect off surfaces like water, sand, and snow. Wear protective clothing, wide-brimmed hats, and UV-blocking sunglasses. Seek shade during peak UV hours between 10 AM and 4 PM. Your future self will thank you for preventing premature aging and skin damage.'
  },
  {
    id: 'treatment-tips',
    title: 'Active Ingredient Guide',
    category: 'treatment',
    duration: '2.5 min',
    content: 'Introduce active ingredients gradually. Start with retinol 2-3 times per week, use vitamin C in the morning, and alternate AHA/BHA treatments. Always patch test new products and use sunscreen when using actives.',
    audioText: 'Active ingredients are powerful tools for addressing specific skin concerns, but they require careful introduction. Start with retinol, the gold standard for anti-aging. Begin with a low concentration 2-3 times per week, gradually increasing frequency as your skin builds tolerance. Use vitamin C serum in the morning for antioxidant protection and brightening. Alternate between AHA and BHA treatments - AHAs like glycolic acid exfoliate the surface for smoother skin, while BHAs like salicylic acid penetrate pores to clear congestion. Never combine retinol with AHA or BHA in the same routine. Always patch test new products on a small area first. Most importantly, use sunscreen daily when using active ingredients, as they can increase sun sensitivity.'
  }
];

export default function VoiceSkincareWidget({ onClose }: VoiceSkincareWidgetProps) {
  const [selectedTip, setSelectedTip] = useState<SkincareTip | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'morning':
        return <Sun className="h-4 w-4" />;
      case 'evening':
        return <Moon className="h-4 w-4" />;
      case 'hydration':
        return <Droplets className="h-4 w-4" />;
      case 'protection':
        return <Heart className="h-4 w-4" />;
      case 'treatment':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'morning':
        return 'bg-yellow-500/20 border-yellow-400/30 text-yellow-200';
      case 'evening':
        return 'bg-purple-500/20 border-purple-400/30 text-purple-200';
      case 'hydration':
        return 'bg-blue-500/20 border-blue-400/30 text-blue-200';
      case 'protection':
        return 'bg-red-500/20 border-red-400/30 text-red-200';
      case 'treatment':
        return 'bg-green-500/20 border-green-400/30 text-green-200';
      default:
        return 'bg-gray-500/20 border-gray-400/30 text-gray-200';
    }
  };

  const generateVoiceAudio = async (text: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
      }
    } catch (error) {
      console.error('Error generating audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const playTip = async (tip: SkincareTip) => {
    setSelectedTip(tip);
    await generateVoiceAudio(tip.audioText);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const resetAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <Volume2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Voice Skincare Tips</h2>
                <p className="text-sm text-gray-600">AI-guided skincare advice</p>
              </div>
            </div>
            <Button 
              onClick={onClose} 
              variant="ghost" 
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedTip ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Choose a skincare tip to listen to personalized voice guidance:
              </p>
              
              {skincareTips.map((tip) => (
                <div
                  key={tip.id}
                  onClick={() => playTip(tip)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${getCategoryColor(tip.category)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getCategoryIcon(tip.category)}
                      <div className="flex-1">
                        <h3 className="font-medium text-white mb-1">{tip.title}</h3>
                        <p className="text-sm text-white/80 mb-2">{tip.content}</p>
                        <span className="text-xs text-white/60">{tip.duration} listen</span>
                      </div>
                    </div>
                    <Play className="h-4 w-4 text-white/80 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={() => setSelectedTip(null)}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-800 mb-4"
              >
                ← Back to tips
              </Button>
              
              <div className={`p-4 rounded-lg border ${getCategoryColor(selectedTip.category)}`}>
                <div className="flex items-start gap-3 mb-4">
                  {getCategoryIcon(selectedTip.category)}
                  <div>
                    <h3 className="font-medium text-white mb-1">{selectedTip.title}</h3>
                    <p className="text-sm text-white/80">{selectedTip.content}</p>
                  </div>
                </div>
              </div>
              
              {/* Audio Player */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={togglePlayPause}
                      disabled={isLoading}
                      size="sm"
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      onClick={resetAudio}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      onClick={toggleMute}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div
                  ref={progressRef}
                  onClick={handleProgressClick}
                  className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
                >
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-100"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <audio ref={audioRef} preload="metadata" />
      </div>
    </div>
  );
}