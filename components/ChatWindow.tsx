
import React, { useState, useRef, useEffect } from 'react';
import type { User, Message } from '../types';
import { PhoneIcon, SendIcon } from './icons';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
  currentUser: User;
  selectedContact: User;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onInitiateCall: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  currentUser,
  selectedContact,
  messages,
  onSendMessage,
  onInitiateCall,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-skype-dark">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-skype-dark-gray">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-skype-blue flex items-center justify-center text-white font-bold mr-3">
            {getInitials(selectedContact.username)}
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedContact.username}</p>
            <p className="text-sm text-green-500">Online</p>
          </div>
        </div>
        <button
          onClick={onInitiateCall}
          className="p-2 rounded-full text-skype-accent hover:bg-gray-200 dark:hover:bg-skype-dark-gray transition-colors"
          title={`Call ${selectedContact.username}`}
        >
          <PhoneIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-grow p-4 overflow-y-auto bg-gray-50 dark:bg-skype-dark/50">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwnMessage={msg.sender === currentUser.username} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-skype-dark-gray flex items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-grow bg-skype-gray dark:bg-skype-dark-gray rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-skype-accent dark:text-white"
        />
        <button
          onClick={handleSend}
          className="ml-4 p-3 rounded-full bg-skype-blue text-white hover:bg-skype-accent transition-colors disabled:bg-gray-400"
          disabled={!inputText.trim()}
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
