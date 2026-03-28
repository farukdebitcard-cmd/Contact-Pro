import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageSquare } from 'lucide-react';
import { getContacts, Contact } from '../lib/db';
import { formatPhone } from '../lib/phone';
import { cn } from '../lib/utils';

export default function Messages() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getContacts().then(setContacts);
  }, []);

  const filteredContacts = useMemo(() => {
    if (!search) return contacts;
    const lowerSearch = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.phone.includes(lowerSearch)
    );
  }, [contacts, search]);

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
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-4 pt-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 ml-2">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts to message"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 pb-24 space-y-1">
        {filteredContacts.map((contact) => (
          <Link
            key={contact.id}
            to={`/messages/${contact.id}`}
            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium", getRandomColor(contact.name))}>
              {getInitials(contact.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-medium text-gray-900 dark:text-white truncate">
                {contact.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                {formatPhone(contact.phone)}
              </p>
            </div>
            <div className="p-2 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-full">
              <MessageSquare className="w-5 h-5" />
            </div>
          </Link>
        ))}

        {filteredContacts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MessageSquare className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-700" />
            <p>No contacts found</p>
          </div>
        )}
      </div>
    </div>
  );
}
