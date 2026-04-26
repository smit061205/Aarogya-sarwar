import { useState, useEffect, useRef } from 'react';

// Stable session ID for this browser tab
const SESSION_ID = `session_${Date.now()}`;

// Read patient data from localStorage
function getPatientContext() {
  try {
    const medications = JSON.parse(localStorage.getItem('aarogya_medications') || '[]');
    const meals = JSON.parse(localStorage.getItem('aarogya_meals') || '[]');
    return { medications, meals };
  } catch {
    return { medications: [], meals: [] };
  }
}

const DOCTORS = [
  { id: 'doc1', name: 'Dr. Jane Doe', specialty: 'General Physician', initials: 'JD', color: 'bg-blue-600' },
  { id: 'doc2', name: 'Dr. John Smith', specialty: 'Cardiologist', initials: 'JS', color: 'bg-rose-600' },
  { id: 'doc3', name: 'Dr. Emily Chen', specialty: 'Endocrinologist', initials: 'EC', color: 'bg-emerald-600' },
  { id: 'doc4', name: 'Dr. Aarav Patel', specialty: 'Nutritionist', initials: 'AP', color: 'bg-amber-600' }
];

export default function Chat() {
  const [view, setView] = useState('list'); // 'list' or 'chat'
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [messages, setMessages] = useState([]);
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
    if (view === 'chat') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, view]);

  const handleSelectDoctor = (doc) => {
    setSelectedDoctor(doc);
    setMessages([{
      role: 'ai',
      text: `Hello! I am ${doc.name}, your ${doc.specialty}. How can I help you today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setView('chat');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedDoctor(null);
    setMessages([]);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading || !selectedDoctor) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { role: 'user', text, time }]);
    setInput('');
    setIsLoading(true);

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
      
      // Prepend context so AI acts as the doctor
      const contextualMessage = `[System Note: Act strictly as ${selectedDoctor.name}, a ${selectedDoctor.specialty}. Respond compassionately and professionally as this doctor. Keep responses concise.]\n\nPatient says: ${text}`;

      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: contextualMessage,
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
          text: "I'm having trouble connecting right now. If this is an emergency, please use the SOS button.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const { medications, meals } = getPatientContext();
  const takenCount = medications.filter((m) => m.taken).length;
  const totalMeds = medications.length;
  const totalMeals = meals.length;

  if (view === 'list') {
    return (
      <div className="flex flex-col w-full mt-4 flex-1 h-full animate-[fadeIn_0.3s_ease-out] px-2 md:px-0">
        <h1 className="text-[28px] font-black text-on-surface leading-tight mb-2">Select a Doctor</h1>
        <p className="text-on-surface-variant text-[15px] font-medium mb-6">Choose a specialist to start a consultation.</p>
        
        <div className="flex flex-col gap-3">
          {DOCTORS.map(doc => (
            <button
              key={doc.id}
              onClick={() => handleSelectDoctor(doc)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest border-2 border-outline-variant/30 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-primary/50 hover:shadow-[0_4px_20px_rgba(0,93,172,0.1)] transition-all text-left group active:scale-95"
            >
              <div className={`w-14 h-14 rounded-full ${doc.color} text-white flex items-center justify-center font-black text-[20px] shadow-sm flex-shrink-0`}>
                {doc.initials}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[17px] text-on-surface group-hover:text-primary transition-colors">{doc.name}</h3>
                <p className="text-[13px] text-on-surface-variant font-bold mt-0.5">{doc.specialty}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary-fixed transition-colors">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary transition-colors">chat</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full mt-2 md:mt-4 flex-1 h-full animate-[fadeIn_0.25s_ease-out]">
      {/* Doctor Header */}
      <div className="bg-surface-container-low px-3 py-3 flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl mb-3">
        <button onClick={handleBackToList} className="w-11 h-11 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors active:scale-90" aria-label="Back to doctors">
          <span className="material-symbols-outlined text-[24px] text-on-surface-variant">arrow_back</span>
        </button>
        <div className={`w-12 h-12 rounded-full ${selectedDoctor.color} flex-shrink-0 flex items-center justify-center shadow-md`}>
          <span className="text-white font-black text-[18px]">{selectedDoctor.initials}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-[16px] font-black text-on-surface m-0 leading-tight">{selectedDoctor.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-body-md text-[13px] text-on-surface-variant font-bold">{selectedDoctor.specialty} — Online</span>
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
              {totalMeals} meal{totalMeals !== 1 ? 's' : ''} logged
            </span>
          )}
          <span className="bg-surface-container text-on-surface-variant text-xs px-3 py-1.5 rounded-full italic">
            Doctor has access to your logs
          </span>
        </div>
      )}

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4 pr-1 scroll-smooth">
        <div className="flex justify-center my-1">
          <span className="bg-surface-container-high text-on-surface-variant font-black text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-full shadow-sm">
            Today
          </span>
        </div>

        {messages.map((msg, idx) =>
          msg.role === 'ai' ? (
            <div key={idx} className="flex justify-start w-full">
              <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]">
                <div className="bg-surface-container-lowest text-on-surface p-4 rounded-[20px] rounded-tl-[4px] shadow-sm border border-outline-variant/30">
                  <p className="font-body-lg text-[15px] m-0 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="font-body-md text-[11px] font-bold text-outline ml-2">{msg.time}</span>
              </div>
            </div>
          ) : (
            <div key={idx} className="flex justify-end w-full">
              <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] items-end">
                <div className="bg-primary text-on-primary p-4 rounded-[20px] rounded-tr-[4px] shadow-md">
                  <p className="font-body-lg text-[15px] m-0 leading-relaxed">{msg.text}</p>
                </div>
                <span className="font-body-md text-[11px] font-bold text-outline mr-2">{msg.time}</span>
              </div>
            </div>
          )
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="bg-surface-container-lowest text-on-surface px-5 py-3.5 rounded-[20px] rounded-tl-[4px] shadow-sm border border-outline-variant/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-outline animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-outline animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-outline animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 pt-3 border-t border-outline-variant/30 pb-2 md:pb-0"
      >
        <div className="flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="w-full min-h-[52px] bg-surface border-2 border-outline-variant focus:border-primary rounded-full py-3 px-5 font-bold text-[15px] text-on-surface placeholder:text-outline placeholder:font-medium transition-colors outline-none shadow-sm disabled:opacity-60"
            placeholder={`Message ${selectedDoctor.name}...`}
            type="text"
          />
        </div>
        <button
          type="button"
          onClick={toggleListening}
          className={`w-[52px] h-[52px] flex-shrink-0 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all
            ${isListening ? 'bg-error text-white animate-pulse shadow-error/30' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
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
