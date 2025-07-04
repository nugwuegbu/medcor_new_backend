# Avatar Video Recordings

This folder contains recorded avatar videos for the idle loop functionality.

## How to record an avatar video:

1. Open the chat widget with HeyGen avatar
2. Make a POST request to record the avatar:

```bash
curl -X POST http://localhost:5000/api/avatar/record \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "your-avatar-session-id",
    "duration": 10
  }'
```

3. The recording will be saved in the server's `recordings` folder
4. Copy the file to this public folder and rename it to `avatar-idle-loop.mp4`

## Expected file:
- `avatar-idle-loop.mp4` - 10 second loop of the avatar in idle state
- `avatar-idle-loop.webm` - WebM version for browser compatibility (optional)

## Benefits:
- Saves HeyGen API credits by not making API calls until user interacts
- Provides instant visual feedback when chat opens
- Seamless transition to live avatar when user starts typing/speaking