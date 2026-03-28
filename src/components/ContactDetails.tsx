import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, MoreVertical, Phone, MessageSquare, Trash2, Edit2, Mail, Tag, Bell, Calendar, Plus, Check } from 'lucide-react';
import { getContact, toggleFavorite, deleteContact, saveContact, addCallLog, Contact, Reminder } from '../lib/db';
import { formatPhone } from '../lib/phone';
import { cn } from '../lib/utils';

export default function ContactDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');

  useEffect(() => {
    if (id) {
      getContact(id).then(setContact);
    }
  }, [id]);

  if (!contact) return <div className="p-4 text-center">Loading...</div>;

  const handleToggleFavorite = async () => {
    if (id) {
      await toggleFavorite(id);
      setContact((prev) => prev ? { ...prev, favorite: !prev.favorite } : null);
    }
  };

  const handleDelete = async () => {
    if (id && window.confirm('Are you sure you want to delete this contact?')) {
      await deleteContact(id);
      navigate('/');
    }
  };

  const handleCall = async () => {
    if (contact) {
      await addCallLog(contact.phone, contact.id, 'outgoing');
      window.location.href = `tel:${contact.phone}`;
    }
  };

  const handleWhatsApp = () => {
    // WhatsApp requires country code. Since we normalize to 01XXXXXXXXX, we prepend 88
    const waNumber = `88${contact.phone}`;
    window.open(`https://wa.me/${waNumber}`, '_blank');
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleAddReminder = async () => {
    if (!contact || !reminderTitle || !reminderDate) return;
    
    const newReminder: Reminder = {
      id: Date.now().toString(),
      title: reminderTitle,
      date: reminderDate,
      completed: false,
    };

    const updatedContact = {
      ...contact,
      reminders: [...(contact.reminders || []), newReminder]
    };

    await saveContact(updatedContact);
    setContact(updatedContact);
    setReminderTitle('');
    setReminderDate('');
    setShowReminderForm(false);
  };

  const handleToggleReminder = async (reminderId: string) => {
    if (!contact) return;

    const updatedReminders = (contact.reminders || []).map(r => 
      r.id === reminderId ? { ...r, completed: !r.completed } : r
    );

    const updatedContact = { ...contact, reminders: updatedReminders };
    await saveContact(updatedContact);
    setContact(updatedContact);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!contact) return;

    const updatedReminders = (contact.reminders || []).filter(r => r.id !== reminderId);
    const updatedContact = { ...contact, reminders: updatedReminders };
    await saveContact(updatedContact);
    setContact(updatedContact);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleToggleFavorite} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <Star className={cn("w-6 h-6", contact.favorite ? "fill-blue-500 text-blue-500" : "")} />
          </button>
          <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Profile Info */}
        <div className="flex flex-col items-center pt-8 pb-6 bg-white dark:bg-gray-900">
          <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl font-medium mb-4">
            {getInitials(contact.name)}
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{contact.name}</h1>
          {contact.groups.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">{contact.groups.join(', ')}</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4 px-4 py-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <button onClick={handleCall} className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Call</span>
          </button>
          <button onClick={handleWhatsApp} className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">WhatsApp</span>
          </button>
          <Link to={`/edit/${contact.id}`} className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Edit2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Edit</span>
          </Link>
          <button onClick={handleDelete} className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Delete</span>
          </button>
        </div>

        {/* Details List */}
        <div className="p-4 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <Phone className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-base font-medium text-gray-900 dark:text-white">{formatPhone(contact.phone)}</p>
                <p className="text-xs text-gray-500">Mobile</p>
              </div>
              <button onClick={handleWhatsApp} className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>

          {contact.email && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-900 dark:text-white">{contact.email}</p>
                  <p className="text-xs text-gray-500">Email</p>
                </div>
              </div>
            </div>
          )}

          {contact.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-4">
                <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-base text-gray-900 dark:text-white whitespace-pre-wrap">{contact.notes}</p>
                  <p className="text-xs text-gray-500 mt-1">Notes</p>
                </div>
              </div>
            </div>
          )}

          {/* Reminders Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                <Bell className="w-5 h-5 text-blue-500" />
                <h3>Reminders</h3>
              </div>
              <button 
                onClick={() => setShowReminderForm(!showReminderForm)}
                className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showReminderForm && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3">
                <input
                  type="text"
                  placeholder="What to remind?"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="datetime-local"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setShowReminderForm(false)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddReminder}
                    disabled={!reminderTitle || !reminderDate}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {(!contact.reminders || contact.reminders.length === 0) && !showReminderForm && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No reminders set</p>
              )}
              
              {contact.reminders?.map((reminder) => (
                <div key={reminder.id} className={cn("flex items-start gap-3 p-3 rounded-xl border transition-colors", reminder.completed ? "bg-gray-50 dark:bg-gray-900/50 border-transparent" : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700")}>
                  <button 
                    onClick={() => handleToggleReminder(reminder.id)}
                    className={cn("mt-0.5 shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors", reminder.completed ? "bg-green-500 border-green-500 text-white" : "border-gray-300 dark:border-gray-600 text-transparent hover:border-blue-500")}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", reminder.completed ? "text-gray-500 dark:text-gray-400 line-through" : "text-gray-900 dark:text-white")}>
                      {reminder.title}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(reminder.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
