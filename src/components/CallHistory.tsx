import { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Trash2, Clock } from 'lucide-react';
import { getCallHistory, clearCallHistory, getContacts, CallLog, Contact } from '../lib/db';
import { formatPhone } from '../lib/phone';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function CallHistory() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [contacts, setContacts] = useState<Record<string, Contact>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [history, allContacts] = await Promise.all([
      getCallHistory(),
      getContacts()
    ]);
    
    setCalls(history);
    
    const contactMap: Record<string, Contact> = {};
    allContacts.forEach(c => {
      contactMap[c.id] = c;
      // Also map by phone for calls without contactId
      contactMap[c.phone] = c;
    });
    setContacts(contactMap);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all call history?')) {
      await clearCallHistory();
      setCalls([]);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getCallIcon = (type: string) => {
    switch (type) {
      case 'incoming': return <PhoneIncoming className="w-4 h-4 text-blue-500" />;
      case 'outgoing': return <PhoneOutgoing className="w-4 h-4 text-green-500" />;
      case 'missed': return <PhoneMissed className="w-4 h-4 text-red-500" />;
      default: return <Phone className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-4 pt-4 pb-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white ml-2">Recents</h1>
        {calls.length > 0 && (
          <button 
            onClick={handleClearHistory}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Clock className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-700" />
            <p>No recent calls</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {calls.map((call) => {
              const contact = call.contactId ? contacts[call.contactId] : contacts[call.number];
              const displayName = contact ? contact.name : formatPhone(call.number);
              
              return (
                <div key={call.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full shrink-0">
                      {getCallIcon(call.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn("text-base font-medium truncate", call.type === 'missed' ? "text-red-500" : "text-gray-900 dark:text-white")}>
                        {displayName}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{formatTime(call.timestamp)}</span>
                        {!contact && <span>• {formatPhone(call.number)}</span>}
                      </div>
                    </div>
                  </div>
                  <a 
                    href={`tel:${call.number}`}
                    className="p-3 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors shrink-0 ml-2"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
