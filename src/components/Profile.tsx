import { useState, useEffect } from 'react';
import { User, Phone, Mail, Save, Download, Wand2, Key, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSetting, saveSetting, getContacts } from '../lib/db';
import { normalizePhone } from '../lib/phone';
import Papa from 'papaparse';

export default function Profile() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [smsApiKey, setSmsApiKey] = useState('ozrv3eNMDtbPE1urSYlo');
  const [smsSenderId, setSmsSenderId] = useState('8809617622592');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    getSetting('profile').then((profile) => {
      if (profile) {
        setName(profile.name || '');
        setPhone(profile.phone || '');
        setEmail(profile.email || '');
      }
    });
    getSetting('smsSettings').then((settings) => {
      if (settings) {
        setSmsApiKey(settings.apiKey || 'ozrv3eNMDtbPE1urSYlo');
        setSmsSenderId(settings.senderId || '8809617622592');
      }
    });
  }, []);

  const handleSaveProfile = async () => {
    await saveSetting('profile', { name, phone: normalizePhone(phone), email });
    await saveSetting('smsSettings', { apiKey: smsApiKey, senderId: smsSenderId });
    setIsEditing(false);
  };

  const handleExportCSV = async () => {
    const contacts = await getContacts();
    const csv = Papa.unparse(contacts.map(c => ({
      Name: c.name,
      Phone: c.phone,
      Email: c.email,
      Groups: c.groups.join(', '),
      Notes: c.notes
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'contacts_export.csv';
    link.click();
  };

  const getInitials = (n: string) => {
    if (!n) return 'ME';
    const parts = n.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white ml-2">My Profile</h1>
        {isEditing ? (
          <button onClick={handleSaveProfile} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full font-medium flex items-center gap-2">
            <Save className="w-5 h-5" />
            <span>Save</span>
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full font-medium">
            Edit
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* Avatar Section */}
        <div className="flex flex-col items-center pt-4 pb-2">
          <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl font-medium mb-4">
            {getInitials(name)}
          </div>
          {!isEditing && (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{name || 'My Name'}</h2>
              <p className="text-sm text-gray-500 mt-1">{phone || 'No phone number set'}</p>
            </>
          )}
        </div>

        {/* Personal Info Form */}
        {isEditing && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <User className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-transparent text-gray-900 dark:text-white text-base focus:outline-none placeholder-gray-400"
                />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  placeholder="Phone Number (for SMS reminders)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-transparent text-gray-900 dark:text-white text-base focus:outline-none placeholder-gray-400"
                />
              </div>
            </div>
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

            <h3 className="text-sm font-medium text-gray-900 dark:text-white pt-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              SMS Reminder Settings
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <Key className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="BulkSMSBD API Key"
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  className="flex-1 bg-transparent text-gray-900 dark:text-white text-base focus:outline-none placeholder-gray-400"
                />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sender ID"
                  value={smsSenderId}
                  onChange={(e) => setSmsSenderId(e.target.value)}
                  className="flex-1 bg-transparent text-gray-900 dark:text-white text-base focus:outline-none placeholder-gray-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Data Management */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Download className="w-4 h-4 text-green-500" />
            App Settings & Data
          </h3>
          <Link
            to="/security"
            className="w-full flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">App Security (Passkey)</span>
            </div>
          </Link>
          <Link
            to="/merge"
            className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Wand2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Auto Cleaner & Merge</span>
            </div>
          </Link>
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">Export Contacts to CSV</span>
            <Download className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
