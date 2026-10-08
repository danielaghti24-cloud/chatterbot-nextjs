import React from 'react';
import { Message } from '@/types/chat';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white shadow-md">
          <Bot className="w-4 h-4" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-none'
            : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'
        }`}
      >
        <p className="text-xs font-semibold mb-1 opacity-70">
          {isUser ? 'Tú (Estudiante)' : 'Gemini AI'}
        </p>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
        {message.timestamp.getTime() > 0 && (
          <span
            suppressHydrationWarning
            className="block text-[10px] mt-2 opacity-50 text-right"
          >
            {new Date(message.timestamp).toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-200">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};