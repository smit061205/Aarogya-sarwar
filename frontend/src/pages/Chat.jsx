import { useState, useEffect, useRef } from 'react';

// Stable session ID for this browser tab
const SESSION_ID = `session_${Date.now()}`;

// Read patient data from localStorage (written by Medications and Meals pages)
function getPatientContext() {
  try {
    const medications = JSON.parse(localStorage.getItem('aarogya_medications') || '[]');
    const meals = JSON.parse(localStorage.getItem('aarogya_meals') || '[]');
    return { medications, meals };
  } catch {
    return { medications: [], meals: [] };
  }
}

const INITIAL_MESSAGE = {
  role: 'ai',
  text: "Hello! I'm HealthAssist, your personal health companion. How are you feeling today?",
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export default function Chat() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please enable mic permissions in your browser settings.');
        } else if (event.error === 'no-speech') {
          // ignore silent errors
        } else {
          alert(`Microphone error: ${event.error}`);
        }
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = (e) => {
    e.preventDefault();
    if (!recognitionRef.current) {
      alert("Voice input is not fully supported by this browser. Please use Chrome on Android/Desktop or Safari on iOS.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Mic start failed", err);
        alert("Microphone failed to start. Please refresh the page and try again.");
      }
    }
  };

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { role: 'user', text, time }]);
    setInput('');
    setIsLoading(true);

    // Grab fresh patient context right at send time so it always reflects latest data
    const { medications, meals } = getPatientContext();
    
    let currentPatientName = 'Smit';
    try {
      const p = JSON.parse(localStorage.getItem('aarogya_profile') || '{}');
      if (p.name) currentPatientName = p.name;
    } catch (e) {
      // default fallback
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: SESSION_ID,
          medications,
          meals,
          patient_name: currentPatientName,
        }),
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: data.response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: "I'm having trouble connecting right now. If this is urgent, please use the Emergency SOS button.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Context summary for UI — show what the AI knows
  const { medications, meals } = getPatientContext();
  const takenCount = medications.filter((m) => m.taken).length;
  const totalMeds = medications.length;
  const totalMeals = meals.length;

  return (
    <div className="flex flex-col w-full mt-4 flex-1 h-full">
      {/* AI Header */}
      <div className="bg-surface-container-low px-4 py-4 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl mb-3">
        <div className="w-14 h-14 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center shadow-md">
          <span
            className="material-symbols-outlined text-[32px] text-white"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            health_and_safety
          </span>
        </div>
        <div className="flex-1">
          <h2 className="font-h2 text-h2 text-on-surface m-0">HealthAssist</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-body-md text-sm text-on-surface-variant">AI Support — Online</span>
          </div>
        </div>
      </div>

      {/* Patient context awareness pill */}
      {(totalMeds > 0 || totalMeals > 0) && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {totalMeds > 0 && (
            <span className="bg-primary-fixed text-on-primary-fixed text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">medication</span>
              {takenCount}/{totalMeds} meds taken
            </span>
          )}
          {totalMeals > 0 && (
            <span className="bg-secondary-fixed text-on-secondary-fixed text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">restaurant</span>
              {totalMeals} meal{totalMeals !== 1 ? 's' : ''} logged today
            </span>
          )}
          <span className="bg-surface-container text-on-surface-variant text-xs px-3 py-1.5 rounded-full italic">
            AI knows your health context
          </span>
        </div>
      )}

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-stack-md pb-4 pr-1">
        <div className="flex justify-center my-2">
          <span className="bg-surface-container-high text-on-surface-variant font-label-bold text-sm px-4 py-2 rounded-full shadow-sm">
            Today
          </span>
        </div>

        {messages.map((msg, idx) =>
          msg.role === 'ai' ? (
            <div key={idx} className="flex justify-start w-full">
              <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[72%]">
                <div className="bg-primary text-on-primary p-4 rounded-[24px] rounded-tl-[4px] shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                  <p className="font-body-lg text-[16px] m-0 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="font-body-md text-xs text-outline ml-2">{msg.time}</span>
              </div>
            </div>
          ) : (
            <div key={idx} className="flex justify-end w-full">
              <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[72%] items-end">
                <div className="bg-surface-container-highest text-on-surface p-4 rounded-[24px] rounded-tr-[4px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30">
                  <p className="font-body-lg text-[16px] m-0 leading-relaxed">{msg.text}</p>
                </div>
                <span className="font-body-md text-xs text-outline mr-2">{msg.time}</span>
              </div>
            </div>
          )
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="bg-primary text-on-primary px-5 py-3.5 rounded-[24px] rounded-tl-[4px] shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-on-primary/80 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-on-primary/80 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-on-primary/80 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 pt-3 border-t border-outline-variant/30 pb-2"
      >
        <div className="flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="w-full min-h-[52px] bg-surface border-2 border-outline-variant focus:border-primary rounded-[28px] py-3 px-4 font-body-lg text-[16px] text-on-surface placeholder:text-outline transition-colors outline-none shadow-sm disabled:opacity-60"
            placeholder="Ask HealthAssist anything…"
            type="text"
          />
        </div>
        <button
          type="button"
          onClick={toggleListening}
          className={`w-[52px] h-[52px] flex-shrink-0 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all
            ${isListening ? 'bg-error text-white animate-pulse shadow-error/30' : 'bg-surface-container-highest text-on-surface'}`}
          aria-label="Toggle voice input"
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
            mic
          </span>
        </button>
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="w-[52px] h-[52px] flex-shrink-0 rounded-full bg-primary disabled:bg-primary-fixed-dim flex items-center justify-center text-on-primary shadow-md active:scale-95 transition-all"
          aria-label="Send message"
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            send
          </span>
        </button>
      </form>
    </div>
  );
}
