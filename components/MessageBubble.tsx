
import React from 'react';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  const alignment = isOwnMessage ? 'justify-end' : 'justify-start';
  const bubbleColor = isOwnMessage
    ? 'bg-skype-blue text-white'
    : 'bg-skype-gray dark:bg-skype-dark-gray dark:text-gray-200';
  const borderRadius = isOwnMessage
    ? 'rounded-l-lg rounded-br-lg'
    : 'rounded-r-lg rounded-bl-lg';

  return (
    <div className={`flex ${alignment} mb-4`}>
      <div
        className={`max-w-md px-4 py-2 rounded-lg shadow-md ${bubbleColor} ${borderRadius}`}
      >
        <p className="text-sm">{message.text}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
