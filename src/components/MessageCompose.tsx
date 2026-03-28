import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { getContact, Contact } from '../lib/db';
import { formatPhone } from '../lib/phone';
import { cn } from '../lib/utils';

const QUICK_REPLIES = [
  "Hey, how are you?",
  "Can you call me?",
  "I'll be there in 5 mins.",
  "Where are you?",
  "Call me back when you get this."
];

export default function MessageCompose() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (id) {
      getContact(id).then(setContact);
    }
  }, [id]);

  if (!contact) return <div className="p-4 text-center">Loading...</div>;

  const handleSendSMS = () => {
    if (!message.trim()) return;
    window.location.href = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
  };

  const handleSendWhatsApp = () => {
    if (!message.trim()) return;
    const waNumber = `88${contact.phone}`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getRandomColor = (name: string) => {
    const colors = ['bg-blue-100 text-blue-600', 'bg-orange-100 text-orange-600', 'bg-pink-100 text-pink-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center p-4 bg-white dark:bg-gray-900 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3 ml-2">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium", getRandomColor(contact.name))}>
            {getInitials(contact.name)}
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">{contact.name}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatPhone(contact.phone)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Quick Replies */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide shrink-0">
          {QUICK_REPLIES.map((reply, i) => (
            <button
              key={i}
              onClick={() => setMessage(prev => prev ? `${prev} ${reply}` : reply)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm whitespace-nowrap text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Text Area */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Draft Message</h3>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 w-full bg-transparent text-gray-900 dark:text-white p-4 text-base focus:outline-none resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4 shrink-0 pb-safe">
          <button
            onClick={handleSendSMS}
            disabled={!message.trim()}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-2xl disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            <Send className="w-6 h-6" />
            <span className="text-sm font-medium">Send SMS</span>
          </button>
          
          <button
            onClick={handleSendWhatsApp}
            disabled={!message.trim()}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-green-600 text-white rounded-2xl disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-sm font-medium">WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
