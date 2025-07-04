import { useEffect, useRef, useState } from "react";
import { Loader } from "lucide-react";

interface HeyGenWebRTCAvatarProps {
  sessionData?: {
    sdp?: string;
    ice_servers?: any[];
    session_id?: string;
    access_token?: string;
    realtime_endpoint?: string;
  };
  isLoading?: boolean;
}

export default function HeyGenWebRTCAvatar({ sessionData, isLoading }: HeyGenWebRTCAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "failed" | "idle">("idle");

  useEffect(() => {
    if (!sessionData?.sdp || !videoRef.current) return;

    const setupWebRTC = async () => {
      try {
        setConnectionStatus("connecting");
        
        // Create RTCPeerConnection with ICE servers
        const iceServers = sessionData.ice_servers || [
          { urls: "stun:stun.l.google.com:19302" }
        ];
        
        const pc = new RTCPeerConnection({ iceServers });
        peerConnectionRef.current = pc;

        // Handle incoming media streams
        pc.ontrack = (event) => {
          console.log("Received track:", event.track.kind);
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
            setConnectionStatus("connected");
          }
        };

        // Set remote description (HeyGen's offer)
        await pc.setRemoteDescription({
          type: "offer",
          sdp: sessionData.sdp
        });

        // Create and set local answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Connect to HeyGen WebSocket and send answer
        if (sessionData.realtime_endpoint) {
          const ws = new WebSocket(sessionData.realtime_endpoint);
          
          ws.onopen = () => {
            console.log("Connected to HeyGen WebSocket");
            // Send the answer to HeyGen
            ws.send(JSON.stringify({
              type: "answer",
              data: {
                sdp: answer.sdp,
                type: "answer"
              }
            }));
          };

          ws.onmessage = (event) => {
            console.log("HeyGen message:", event.data);
            try {
              const message = JSON.parse(event.data);
              // Handle ICE candidates and other messages from HeyGen
              if (message.type === "ice-candidate" && message.candidate) {
                pc.addIceCandidate(message.candidate);
              }
            } catch (e) {
              console.error("Failed to parse HeyGen message:", e);
            }
          };

          ws.onerror = (error) => {
            console.error("HeyGen WebSocket error:", error);
          };
        }

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          console.log("Connection state:", pc.connectionState);
          if (pc.connectionState === "connected") {
            setConnectionStatus("connected");
          } else if (pc.connectionState === "failed") {
            setConnectionStatus("failed");
          }
        };

      } catch (error) {
        console.error("WebRTC setup error:", error);
        setConnectionStatus("failed");
      }
    };

    setupWebRTC();

    // Cleanup
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [sessionData]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Connecting to HeyGen avatar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg overflow-hidden">
      {sessionData ? (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted={false}
          />
          {connectionStatus === "connecting" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <Loader className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Establishing connection...</p>
              </div>
            </div>
          )}
          {connectionStatus === "failed" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-sm text-white">Connection failed. Please try again.</p>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-32 bg-gradient-to-b from-white to-blue-50 rounded-lg border-2 border-white shadow-lg mx-auto mb-4">
              {/* Placeholder avatar */}
              <div className="relative h-20 bg-gradient-to-b from-pink-100 to-pink-50">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-amber-700 rounded-t-full"></div>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-14 bg-pink-100 rounded-full">
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-800 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-blue-800 rounded-full"></div>
                  </div>
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-pink-200 rounded-full"></div>
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-red-200 rounded-full"></div>
                </div>
              </div>
              <div className="h-12 bg-white relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-gray-100 rounded-t-sm"></div>
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-6 h-6">
                  <div className="w-full h-1 bg-gray-600 rounded-full"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-600 rounded-full"></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600">Ready to connect</p>
          </div>
        </div>
      )}
    </div>
  );
}