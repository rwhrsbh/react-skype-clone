
import React from 'react';
import type { User } from '../types';

interface ContactItemProps {
  user: User;
  isSelected: boolean;
  onClick: (username: string) => void;
  unreadCount: number;
}

const ContactItem: React.FC<ContactItemProps> = ({ user, isSelected, onClick, unreadCount }) => {
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div
      onClick={() => onClick(user.username)}
      className={`flex items-center p-3 cursor-pointer transition-colors duration-200 ${
        isSelected
          ? 'bg-skype-accent/20 dark:bg-skype-accent/30'
          : 'hover:bg-gray-100 dark:hover:bg-skype-dark-gray'
      }`}
    >
      <div className="relative mr-4">
        <div className="w-12 h-12 rounded-full bg-skype-blue flex items-center justify-center text-white font-bold text-xl">
          {getInitials(user.username)}
        </div>
        <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white dark:border-skype-dark"></span>
      </div>
      <div className="flex-grow">
        <p className="font-semibold text-gray-800 dark:text-gray-200">{user.username}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Online</p>
      </div>
      {unreadCount > 0 && (
          <div className="w-6 h-6 bg-skype-blue rounded-full flex items-center justify-center text-white text-xs font-bold">
            {unreadCount}
          </div>
        )}
    </div>
  );
};

export default ContactItem;
