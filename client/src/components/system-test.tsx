import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Play, Mic, Bot, Zap } from "lucide-react";

interface TestResult {
  name: string;
  status: "pending" | "success" | "error";
  message: string;
  duration?: number;
}

export default function SystemTest() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (name: string, status: "pending" | "success" | "error", message: string, duration?: number) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, status, message, duration } : t);
      }
      return [...prev, { name, status, message, duration }];
    });
  };

  const runSystemTests = async () => {
    setIsRunning(true);
    setTests([]);

    // Test 1: OpenAI API
    updateTest("OpenAI API", "pending", "Testing AI response generation...");
    const startTime1 = Date.now();
    try {
      const response = await fetch("/api/chat/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Hello, can you help me?",
          sessionId: "test_session_" + Date.now(),
          language: "en"
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        updateTest("OpenAI API", "success", `Response: "${data.message?.substring(0, 50)}..."`, Date.now() - startTime1);
      } else {
        updateTest("OpenAI API", "error", `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      updateTest("OpenAI API", "error", `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 2: HeyGen Avatar API
    updateTest("HeyGen Avatar", "pending", "Testing avatar generation...");
    const startTime2 = Date.now();
    try {
      const response = await fetch("/api/avatar/test-streaming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Hello, I'm your health assistant. Testing the HeyGen streaming API."
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          updateTest("HeyGen Avatar", "success", `Avatar spoke successfully! Session: ${data.sessionId}`, Date.now() - startTime2);
        } else {
          updateTest("HeyGen Avatar", "error", `Failed: ${data.error || 'Unknown error'}`);
        }
      } else {
        const errorData = await response.json();
        updateTest("HeyGen Avatar", "error", `HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      updateTest("HeyGen Avatar", "error", `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 3: Microphone Access
    updateTest("Microphone", "pending", "Testing microphone permissions...");
    const startTime3 = Date.now();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      updateTest("Microphone", "success", "Microphone access granted", Date.now() - startTime3);
    } catch (error) {
      updateTest("Microphone", "error", `Permission denied or no microphone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: Speech-to-Text API
    updateTest("Speech-to-Text", "pending", "Testing speech transcription...");
    const startTime4 = Date.now();
    try {
      const response = await fetch("/api/speech-to-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: "mock_audio_data",
          language: "en"
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        updateTest("Speech-to-Text", "success", `Transcription: "${data.text?.substring(0, 50)}..."`, Date.now() - startTime4);
      } else {
        updateTest("Speech-to-Text", "error", `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      updateTest("Speech-to-Text", "error", `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 5: Face Recognition API
    updateTest("Face Recognition", "pending", "Testing face recognition...");
    const startTime5 = Date.now();
    try {
      const response = await fetch("/api/face/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: "mock_image_data",
          sessionId: "test_session_" + Date.now()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        updateTest("Face Recognition", "success", `Recognition result: ${data.recognized ? 'Recognized' : 'New user'}`, Date.now() - startTime5);
      } else {
        updateTest("Face Recognition", "error", `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      updateTest("Face Recognition", "error", `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: "pending" | "success" | "error") => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <AlertCircle className="h-5 w-5 text-yellow-500 animate-pulse" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Medcor AI System Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Test all core system components to verify functionality
          </p>
          <Button 
            onClick={runSystemTests}
            disabled={isRunning}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            {isRunning ? (
              <>
                <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Tests
              </>
            )}
          </Button>
        </div>

        {tests.length > 0 && (
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <p className="font-medium text-sm">{test.name}</p>
                    <p className="text-xs text-gray-600">{test.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {test.duration && (
                    <Badge variant="secondary" className="text-xs">
                      {test.duration}ms
                    </Badge>
                  )}
                  <Badge 
                    variant={test.status === "success" ? "default" : test.status === "error" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {test.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <p>🔹 OpenAI API: Tests GPT-4o chat responses</p>
          <p>🔹 HeyGen Avatar: Tests interactive avatar generation</p>
          <p>🔹 Microphone: Tests browser microphone access</p>
          <p>🔹 Speech-to-Text: Tests voice transcription</p>
          <p>🔹 Face Recognition: Tests patient recognition system</p>
        </div>
      </CardContent>
    </Card>
  );
}