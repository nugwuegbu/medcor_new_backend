import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface VideoPlayerProblem {
  sessionId: string;
  mode: string;
  videoUrl: string;
  isPlaying: boolean;
  logs: string[];
}

interface AnalysisResult {
  score: number;
  diagnosis: string;
  rootCause: string;
  solution: string;
  codeChanges: string[];
  confidence: number;
}

export async function analyzeVideoPlayerIssue(problemData: VideoPlayerProblem): Promise<AnalysisResult> {
  const prompt = `
CRITICAL VIDEO PLAYER ISSUE ANALYSIS

Problem: adana01 loop video continues playing when mode should switch to "heygen" - HeyGen avatar never activates properly.

Current State:
- Session ID: ${problemData.sessionId}
- Mode: ${problemData.mode}
- Video URL: ${problemData.videoUrl}
- Is Playing: ${problemData.isPlaying}

Debug Logs:
${problemData.logs.join('\n')}

ANALYSIS CRITERIA (Score 0-100):
1. Video Element Control (25 points): Does the solution properly pause/stop the video element?
2. State Management (25 points): Does it prevent state conflicts between loop and heygen modes?
3. Session Isolation (25 points): Does it handle multiple session IDs properly?
4. React Re-rendering (25 points): Does it prevent unnecessary component re-mounts?

REQUIRED ANALYSIS:
1. Root cause identification with exact line/function causing the issue
2. Specific code changes needed with exact file paths
3. Testing strategy to verify the fix
4. Score breakdown for each criterion (must achieve 99+ total)

Respond in JSON format:
{
  "score": number,
  "diagnosis": "detailed technical diagnosis",
  "rootCause": "exact root cause with file/line reference",
  "solution": "step-by-step solution",
  "codeChanges": ["specific code change 1", "specific code change 2"],
  "confidence": number
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert React/TypeScript debugger specializing in video player and state management issues. Provide precise technical analysis with actionable solutions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const analysis = JSON.parse(response.choices[0].message.content!);
    
    console.log(`🤖 OpenAI Analysis Score: ${analysis.score}/100`);
    console.log(`🎯 Root Cause: ${analysis.rootCause}`);
    console.log(`💡 Solution: ${analysis.solution}`);
    
    return analysis;
  } catch (error) {
    console.error('OpenAI analysis failed:', error);
    throw new Error('Failed to analyze video player issue');
  }
}

export async function optimizeVideoPlayerSolution(
  initialAnalysis: AnalysisResult,
  implementationResults: string[]
): Promise<AnalysisResult> {
  const prompt = `
OPTIMIZATION LOOP - VIDEO PLAYER ISSUE

Initial Analysis Score: ${initialAnalysis.score}/100
Initial Solution: ${initialAnalysis.solution}

Implementation Results:
${implementationResults.join('\n')}

OPTIMIZATION REQUIREMENTS:
- Must achieve 99+ score
- Focus on the lowest scoring criteria from initial analysis
- Provide enhanced solution with additional safeguards
- Consider edge cases and race conditions

Previous Code Changes Attempted:
${initialAnalysis.codeChanges.join('\n')}

Provide optimized solution in JSON format with same structure as initial analysis.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert React/TypeScript optimizer. Enhance solutions to achieve 99+ effectiveness scores by addressing edge cases and race conditions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const optimizedAnalysis = JSON.parse(response.choices[0].message.content!);
    
    console.log(`🚀 Optimized Analysis Score: ${optimizedAnalysis.score}/100`);
    console.log(`🔥 Enhanced Solution: ${optimizedAnalysis.solution}`);
    
    return optimizedAnalysis;
  } catch (error) {
    console.error('OpenAI optimization failed:', error);
    throw new Error('Failed to optimize video player solution');
  }
}