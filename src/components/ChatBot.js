import React, { useState, useEffect } from 'react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your attendance assistant. How can I help you?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const responses = {
    'hey': 'Hi! How are you?',
    'hello': 'Hello! How can I help you with attendance today?',
    'hi': 'Hi there! What would you like to know about the attendance system?',
    'help': 'I can help you with:\n• Adding students\n• Marking attendance\n• Viewing reports\n• Managing belt colors\n• Export data',
    'add student': 'To add a student, click the menu (☰) and select "Add Student". Fill in their details and belt color.',
    'attendance': 'To mark attendance, click on the circles next to student names. Green = Present, Red = Absent.',
    'belt': 'You can change belt colors in "View Reports". Students are sorted by belt progression.',
    'export': 'Click "Export Report" to download attendance data as CSV file.',
    'absent': 'Check "Absent Students" in the menu to see who was absent and send WhatsApp messages.',
    'default': "I'm not sure about that. Try asking about: help, add student, attendance, belt colors, or export."
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    const botResponse = { 
      text: responses[input.toLowerCase()] || responses['default'], 
      sender: 'bot' 
    };

    setMessages(prev => [...prev, userMessage, botResponse]);
    setInput('');
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-primary hover-lift"
        style={{
          position: 'fixed',
          bottom: isMobile ? '16px' : '24px',
          right: isMobile ? '16px' : '24px',
          width: isMobile ? '56px' : '64px',
          height: isMobile ? '56px' : '64px',
          borderRadius: '50%',
          fontSize: isMobile ? '20px' : '24px',
          zIndex: 1001,
          boxShadow: 'var(--shadow-xl)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="card fade-in"
          style={{
            position: 'fixed',
            bottom: isMobile ? '80px' : '100px',
            right: isMobile ? '16px' : '24px',
            left: isMobile ? '16px' : 'auto',
            width: isMobile ? 'auto' : '380px',
            height: isMobile ? '70vh' : '500px',
            maxHeight: isMobile ? '70vh' : '500px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            margin: 0,
            boxShadow: 'var(--shadow-xl)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          {/* Header */}
          <div 
            className="card-header"
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--info) 100%)',
              color: 'var(--text-inverse)',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              padding: 'var(--spacing-lg)',
              margin: 0,
              border: 'none'
            }}
          >
            <h3 className="card-title" style={{color: 'var(--text-inverse)', margin: 0, fontSize: isMobile ? '16px' : '18px'}}>
              🤖 Attendance Assistant
            </h3>
          </div>

          {/* Messages */}
          <div 
            className="chatbot-messages"
            style={{
              flex: 1,
              padding: 'var(--spacing-md)',
              overflowY: 'auto',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              scrollbarWidth: 'thin'
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className="flex mb-2"
                style={{
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'fadeInUp 0.3s ease-out'
                }}
              >
                <div 
                  className="transition hover-lift"
                  style={{
                    maxWidth: isMobile ? '85%' : '80%',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.sender === 'user' 
                      ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                      : 'var(--bg-card)',
                    color: msg.sender === 'user' ? 'var(--text-inverse)' : 'var(--text-primary)',
                    fontSize: isMobile ? '13px' : '14px',
                    whiteSpace: 'pre-line',
                    boxShadow: 'var(--shadow-sm)',
                    border: msg.sender === 'bot' ? '1px solid var(--border)' : 'none'
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div 
            className="flex gap-2"
            style={{
              padding: 'var(--spacing-md)',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-card)'
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="form-input"
              style={{
                flex: 1,
                margin: 0,
                fontSize: isMobile ? '14px' : '15px',
                padding: isMobile ? 'var(--spacing-sm)' : 'var(--spacing-md)'
              }}
            />
            <button
              onClick={handleSend}
              className="btn btn-primary hover-lift"
              style={{
                padding: isMobile ? 'var(--spacing-sm) var(--spacing-md)' : 'var(--spacing-md) var(--spacing-lg)',
                fontSize: isMobile ? '12px' : '14px',
                minWidth: isMobile ? '60px' : '70px'
              }}
            >
              {isMobile ? '📤' : '📤 Send'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;