import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Phone, Mail, Tag, Users } from 'lucide-react';
import { getContact, saveContact, getGroups, Group, Contact } from '../lib/db';
import { normalizePhone } from '../lib/phone';

export default function AddEditContact() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    getGroups().then(setAvailableGroups);
    if (id) {
      getContact(id).then((contact) => {
        if (contact) {
          setName(contact.name);
          setPhone(contact.phone);
          setEmail(contact.email);
          setNotes(contact.notes);
          setSelectedGroups(contact.groups);
          setFavorite(contact.favorite);
        }
      });
    }
  }, [id]);

  const handleSave = async () => {
    if (!name || !phone) {
      alert('Name and Phone are required');
      return;
    }

    const contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
      name,
      phone,
      email,
      notes,
      groups: selectedGroups,
      favorite,
    };

    if (id) {
      contactData.id = id;
    }

    await saveContact(contactData);
    navigate(-1);
  };

  const toggleGroup = (groupName: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((g) => g !== groupName)
        : [...prev, groupName]
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {id ? 'Edit Contact' : 'New Contact'}
          </h1>
        </div>
        <button onClick={handleSave} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full font-medium flex items-center gap-2">
          <Save className="w-5 h-5" />
          <span>Save</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* Name */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <User className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-transparent text-gray-900 dark:text-white text-base focus:outline-none placeholder-gray-400"
              autoFocus
            />
          </div>
        </div>

        {/* Phone */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Phone className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent text-gray-900 dark:text-white text-base focus:outline-none placeholder-gray-400"
              />
              {phone && normalizePhone(phone) !== phone && (
                <p className="text-xs text-blue-500 mt-1">
                  Will be saved as: {normalizePhone(phone)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Mail className="w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent text-gray-900 dark:text-white text-base focus:outline-none placeholder-gray-400"
            />
          </div>
        </div>

        {/* Groups */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <Users className="w-5 h-5 text-gray-400 mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-3">Groups</p>
              <div className="flex flex-wrap gap-2">
                {availableGroups.length === 0 && (
                  <p className="text-xs text-gray-400">No groups created yet. Manage groups in Settings.</p>
                )}
                {availableGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedGroups.includes(group.name)
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-transparent'
                    }`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <Tag className="w-5 h-5 text-gray-400 mt-1" />
            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="flex-1 bg-transparent text-gray-900 dark:text-white text-base focus:outline-none placeholder-gray-400 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
