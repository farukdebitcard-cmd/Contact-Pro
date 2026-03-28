import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Star, UserPlus, FileUp } from 'lucide-react';
import { getContacts, getGroups, Contact, Group } from '../lib/db';
import { cn } from '../lib/utils';
import { formatPhone } from '../lib/phone';

export default function ContactsList() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    getContacts().then(setContacts);
    getGroups().then(setGroups);
  }, []);

  const filteredContacts = useMemo(() => {
    let result = contacts;
    
    if (selectedGroup) {
      result = result.filter(c => c.groups.includes(selectedGroup));
    }

    if (!search) return result;
    
    const lowerSearch = search.toLowerCase();
    return result.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.phone.includes(lowerSearch) ||
        c.groups.some((g) => g.toLowerCase().includes(lowerSearch))
    );
  }, [contacts, search, selectedGroup]);

  const favorites = filteredContacts.filter((c) => c.favorite);
  const others = filteredContacts.filter((c) => !c.favorite);

  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {};
    others.forEach((c) => {
      const firstLetter = c.name.charAt(0).toUpperCase() || '#';
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(c);
    });
    return Object.keys(groups)
      .sort()
      .map((letter) => ({
        letter,
        contacts: groups[letter].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [others]);

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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={() => navigate('/groups')} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Group Filter Chips */}
        {groups.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedGroup(null)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                selectedGroup === null
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              )}
            >
              All
            </button>
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.name)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  selectedGroup === group.name
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                )}
              >
                {group.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300 font-medium">
              <Star className="w-4 h-4 fill-current" />
              <span>Favorite</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {favorites.map((contact) => (
                <Link
                  key={contact.id}
                  to={`/contact/${contact.id}`}
                  className="flex flex-col items-center gap-2 min-w-[72px]"
                >
                  <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-xl font-medium", getRandomColor(contact.name))}>
                    {getInitials(contact.name)}
                  </div>
                  <span className="text-xs font-medium truncate w-full text-center">
                    {contact.name.split(' ')[0]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Grouped Contacts */}
        {groupedContacts.map((group) => (
          <div key={group.letter} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 pl-2">
              {group.letter}
            </h3>
            <div className="space-y-1">
              {group.contacts.map((contact) => (
                <Link
                  key={contact.id}
                  to={`/contact/${contact.id}`}
                  className="flex items-center gap-4 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium", getRandomColor(contact.name))}>
                    {getInitials(contact.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {contact.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {formatPhone(contact.phone)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {contacts.length === 0 && !search && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>No contacts yet</p>
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-3">
        <Link
          to="/import"
          className="w-12 h-12 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
        >
          <FileUp className="w-5 h-5" />
        </Link>
        <Link
          to="/add"
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-6 h-6" />
        </Link>
      </div>
    </div>
  );
}
