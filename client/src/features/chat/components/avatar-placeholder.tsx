export default function AvatarPlaceholder() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
      <div className="text-center p-6 max-w-sm">
        <div className="w-24 h-24 mx-auto mb-4 bg-purple-500 rounded-full flex items-center justify-center animate-pulse">
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Avatar Loading...
        </h3>
        <p className="text-sm text-gray-600">
          Your AI assistant will appear here shortly. Start typing or speaking to activate the live avatar.
        </p>
      </div>
    </div>
  );
}