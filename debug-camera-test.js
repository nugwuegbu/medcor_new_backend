// Camera Debug Test - Selenium Style QA Analysis
// This file helps debug camera issues in the chat widget

console.log("🎯 CAMERA DEBUG TEST - Starting Analysis");

// Test 1: Check Browser Support
console.log("🎯 TEST 1: Browser Camera Support");
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  console.log("✅ Browser supports getUserMedia");
} else {
  console.log("❌ Browser does NOT support getUserMedia");
}

// Test 2: Check Camera Permission State
console.log("🎯 TEST 2: Camera Permission State");
navigator.permissions.query({name: 'camera'}).then((result) => {
  console.log("🎯 Camera permission state:", result.state);
  if (result.state === 'granted') {
    console.log("✅ Camera permission is GRANTED");
  } else if (result.state === 'prompt') {
    console.log("⚠️ Camera permission needs USER PROMPT");
  } else {
    console.log("❌ Camera permission is DENIED");
  }
});

// Test 3: Check Available Cameras
console.log("🎯 TEST 3: Available Camera Devices");
navigator.mediaDevices.enumerateDevices().then((devices) => {
  const cameras = devices.filter(device => device.kind === 'videoinput');
  console.log("🎯 Found", cameras.length, "camera(s):");
  cameras.forEach((camera, index) => {
    console.log(`  Camera ${index + 1}: ${camera.label || 'Unknown Camera'}`);
  });
});

// Test 4: Try to Access Camera
console.log("🎯 TEST 4: Camera Access Test");
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    console.log("✅ Camera access SUCCESS");
    console.log("🎯 Stream details:", stream);
    console.log("🎯 Video tracks:", stream.getVideoTracks().length);
    
    // Stop the stream immediately
    stream.getTracks().forEach(track => track.stop());
  })
  .catch((error) => {
    console.log("❌ Camera access FAILED");
    console.log("🎯 Error name:", error.name);
    console.log("🎯 Error message:", error.message);
    
    // Common error analysis
    if (error.name === 'NotAllowedError') {
      console.log("💡 SOLUTION: User needs to grant camera permission");
    } else if (error.name === 'NotFoundError') {
      console.log("💡 SOLUTION: No camera device found");
    } else if (error.name === 'NotReadableError') {
      console.log("💡 SOLUTION: Camera is already in use by another app");
    } else if (error.name === 'OverconstrainedError') {
      console.log("💡 SOLUTION: Camera constraints are too restrictive");
    }
  });

// Test 5: Check DOM Elements
console.log("🎯 TEST 5: DOM Element Check");
setTimeout(() => {
  const chatWidget = document.querySelector('.chat-widget-container');
  const userCamera = document.querySelector('[data-testid="user-camera"]');
  const videoElement = document.querySelector('video');
  
  console.log("🎯 Chat widget found:", !!chatWidget);
  console.log("🎯 User camera component found:", !!userCamera);  
  console.log("🎯 Video element found:", !!videoElement);
  
  if (videoElement) {
    console.log("🎯 Video element src:", videoElement.srcObject);
    console.log("🎯 Video element playing:", !videoElement.paused);
  }
}, 2000);

console.log("🎯 Camera debug test completed - Check console for results");