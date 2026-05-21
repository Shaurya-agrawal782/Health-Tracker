import React, { useState, useEffect, useRef } from 'react';
import { FiMessageSquare, FiX, FiSend, FiMinimize2, FiMaximize2, FiUser, FiCpu } from 'react-icons/fi';
import { healthAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AIAssistant = () => {
  const disclaimer = 'VitalIQ Health provides wellness insights and lifestyle risk estimates only. It does not diagnose, treat, cure, or replace professional medical advice. For medical concerns, consult a qualified healthcare professional.';
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm VitalIQ, your AI-assisted wellness guide. I can help explain lifestyle trends, wellness risk estimates, and healthier habit ideas."
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await healthAPI.chatWithCoach([...messages, userMessage]);
      setMessages(prev => [...prev, response.data.data]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get a wellness response from VitalIQ. Try again later!');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having a bit of trouble connecting right now. Please try again in a moment! 🔄" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="ai-assistant-trigger"
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 32px rgba(107, 70, 193, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
      >
        <FiMessageSquare size={28} />
        <span style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          width: '12px',
          height: '12px',
          background: '#10b981',
          borderRadius: '50%',
          border: '2px solid white'
        }} />
      </button>
    );
  }

  return (
    <div 
      className={`ai-assistant-window ${isMinimized ? 'minimized' : ''}`}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: isMinimized ? '250px' : '380px',
        height: isMinimized ? '60px' : '550px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid #e2e8f0'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }} onClick={() => setIsMinimized(!isMinimized)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FiCpu size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>VitalIQ Wellness Coach</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{loading ? 'Typing...' : 'Online & Ready'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            {isMinimized ? <FiMaximize2 size={18} /> : <FiMinimize2 size={18} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <FiX size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div style={{
            padding: '12px 16px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            color: '#475569',
            fontSize: '0.74rem',
            lineHeight: 1.45
          }}>
            {disclaimer}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: '#f8fafc'
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                background: msg.role === 'user' ? 'var(--primary)' : 'white',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                fontSize: '0.88rem',
                lineHeight: 1.5,
                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(13, 148, 136, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                border: msg.role === 'user' ? 'none' : '1px solid #f1f5f9'
              }}>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '12px 16px',
                background: 'white',
                borderRadius: '18px 18px 18px 2px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: '1px solid #f1f5f9',
                display: 'flex',
                gap: '4px'
              }}>
                <div className="dot-pulse" style={{ animationDelay: '0s' }} />
                <div className="dot-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="dot-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{
            padding: '16px',
            background: 'white',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: '10px'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about wellness trends..."
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                outline: 'none',
                fontSize: '0.9rem',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                opacity: (!input.trim() || loading) ? 0.6 : 1
              }}
            >
              <FiSend size={18} />
            </button>
          </form>
        </>
      )}
      <style>{`
        .dot-pulse {
          width: 6px;
          height: 6px;
          background: var(--primary);
          border-radius: 50%;
          animation: dotPulse 1.2s infinite ease-in-out;
        }
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse-icon {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.4); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(13, 148, 136, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(13, 148, 136, 0); }
        }
      `}</style>
    </div>
  );
};

export default AIAssistant;
