import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getGroups, saveGroup, deleteGroup, Group } from '../lib/db';

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = () => {
    getGroups().then(setGroups);
  };

  const handleAddGroup = async () => {
    if (newGroupName.trim()) {
      await saveGroup({ name: newGroupName.trim(), color: '#3b82f6' });
      setNewGroupName('');
      loadGroups();
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (window.confirm('Delete this group? Contacts will not be deleted.')) {
      await deleteGroup(id);
      loadGroups();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center p-4 bg-white dark:bg-gray-900 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white ml-2">Manage Groups</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="New Group Name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
              className="flex-1 bg-transparent text-gray-900 dark:text-white text-base focus:outline-none placeholder-gray-400"
            />
            <button
              onClick={handleAddGroup}
              disabled={!newGroupName.trim()}
              className="p-2 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <span className="text-gray-900 dark:text-white font-medium">{group.name}</span>
              <button
                onClick={() => handleDeleteGroup(group.id)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {groups.length === 0 && (
            <p className="text-center text-gray-500 mt-8">No groups created yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
