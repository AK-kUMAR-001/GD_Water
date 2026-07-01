import React, { useState, useEffect, useRef } from 'react';
import { appFetch } from '../utils/api';

interface WhatsAppSimulatorProps {
  onRefresh: () => void;
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({ onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'வணக்கம்! Welcome to Neer Ugam (நீர் யுகம்) AI Helpdesk. 💧\n\nPlease describe your water leakage or contamination issue in English or Tamil (e.g., "pipe burst near Sundarapuram bus stand") to file a grievance.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Show bot typing
    setIsTyping(true);

    try {
      const res = await appFetch('/api/whatsapp/emulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '8925081899',
          message: userText
        })
      });
      const data = await res.json();
      
      // Delay response slightly to simulate realistic typing
      setTimeout(() => {
        setIsTyping(false);
        if (data.success) {
          setMessages(prev => [
            ...prev,
            {
              sender: 'bot',
              text: data.reply,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          // Refresh parent database so the new ticket appears on screen instantly!
          onRefresh();
        } else {
          setMessages(prev => [
            ...prev,
            {
              sender: 'bot',
              text: '⚠️ Sorry, there was an error processing your request. Please try again.',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      }, 1000);

    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: '⚠️ Network error connecting to WhatsApp bot endpoint.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '25px', right: '25px', zIndex: 10000, fontFamily: 'sans-serif' }}>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#25D366',
          border: 'none',
          boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.6rem',
          transition: 'all 0.3s ease',
          outline: 'none'
        }}
        title="Open WhatsApp Chat Simulator"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window Popup */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '70px',
          right: '0',
          width: '320px',
          height: '420px',
          borderRadius: '8px',
          background: '#E5DDD5', // WhatsApp background color
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideDownIn 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{ background: '#075E54', color: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#128C7E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
              💧
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.88rem' }}>Neer Ugam Helpdesk</div>
              <div style={{ fontSize: '0.68rem', color: '#86FFB4', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#86FFB4', display: 'inline-block' }}></span>
                online (AI Bot)
              </div>
            </div>
          </div>

          {/* Messages Body */}
          <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: m.sender === 'user' ? '#DCF8C6' : '#FFFFFF',
                  color: '#1a202c',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  maxWidth: '85%',
                  fontSize: '0.78rem',
                  lineHeight: '1.35',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                  position: 'relative',
                  textAlign: 'left',
                  whiteSpace: 'pre-line'
                }}
              >
                {m.text}
                <div style={{ fontSize: '0.6rem', color: '#718096', textAlign: 'right', marginTop: '4px' }}>
                  {m.time}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ alignSelf: 'flex-start', background: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', color: '#718096', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <form onSubmit={handleSend} style={{ background: '#F0F0F0', padding: '8px', display: 'flex', gap: '6px', borderTop: '1px solid #E0E0E0' }}>
            <input
              type="text"
              placeholder="Type WhatsApp message..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '0.78rem',
                outline: 'none',
                background: '#FFFFFF'
              }}
            />
            <button
              type="submit"
              style={{
                background: '#075E54',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem'
              }}
            >
              ➔
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
