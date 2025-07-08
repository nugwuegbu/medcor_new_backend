# Medcor Frontend Package

This package contains all the frontend components, styles, and UX elements from the Medcor AI healthcare application, ready for integration into other projects.

## Package Contents

### Core Components
- `/components/` - All React components
- `/styles/` - CSS and styling files
- `/hooks/` - Custom React hooks
- `/utils/` - Utility functions
- `/types/` - TypeScript type definitions
- `/assets/` - Icons, images, and other assets

### Key Features Included
- Medical chat interface design
- Voice input components
- Doctor profile cards
- Appointment booking forms
- Calendar components
- Medical-themed UI elements
- Responsive design system
- Dark/light mode support

### Dependencies
```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "@radix-ui/react-*": "latest",
  "tailwindcss": "^3.0.0",
  "framer-motion": "^10.0.0",
  "lucide-react": "^0.263.0"
}
```

### Installation
1. Extract the package to your project
2. Install dependencies: `npm install`
3. Import components as needed
4. Configure Tailwind CSS with provided config

### Usage Example
```jsx
import { ChatInterface } from './components/ChatInterface';
import { DoctorCard } from './components/DoctorCard';
import { VoiceInputButton } from './components/VoiceInputButton';

function App() {
  return (
    <div>
      <ChatInterface />
      <DoctorCard doctor={doctorData} />
      <VoiceInputButton onVoiceInput={handleVoice} />
    </div>
  );
}
```

## API Integration
The package includes API utilities for connecting to backend services. Update the API base URL in `utils/api.js` to match your backend.

## Customization
All colors, fonts, and styling can be customized through the Tailwind config and CSS variables.