import { useEffect, useState } from "react";

interface AnimatedTextOverlayProps {
  text: string;
  isVisible: boolean;
  duration?: number;
}

export default function AnimatedTextOverlay({ text, isVisible, duration = 3000 }: AnimatedTextOverlayProps) {
  const [words, setWords] = useState<string[]>([]);
  const [visibleWords, setVisibleWords] = useState<number>(0);

  useEffect(() => {
    if (isVisible && text) {
      const wordArray = text.split(' ');
      setWords(wordArray);
      setVisibleWords(0);
      
      // Animate words appearing one by one
      wordArray.forEach((_, index) => {
        setTimeout(() => {
          setVisibleWords(index + 1);
        }, index * 200);
      });
    } else {
      setWords([]);
      setVisibleWords(0);
    }
  }, [text, isVisible]);

  if (!isVisible || !text) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 max-w-[90%]">
        <div className="text-center">
          {words.map((word, index) => (
            <span
              key={index}
              className={`inline-block mx-1 text-white font-medium text-sm transition-all duration-500 ${
                index < visibleWords
                  ? 'opacity-100 transform translate-y-0 blur-none'
                  : 'opacity-0 transform translate-y-4 blur-sm'
              }`}
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}