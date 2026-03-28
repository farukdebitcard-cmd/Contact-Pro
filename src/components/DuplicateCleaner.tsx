import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Wand2, CheckCircle, AlertCircle, Trash2, X } from 'lucide-react';
import { getContacts, saveContact, deleteContact, getSetting, saveSetting, Contact } from '../lib/db';
import { formatPhone } from '../lib/phone';

export default function DuplicateCleaner() {
  const navigate = useNavigate();
  const [duplicates, setDuplicates] = useState<Contact[][]>([]);
  const [similarNames, setSimilarNames] = useState<{ id: string, contacts: Contact[] }[]>([]);
  const [emptyNumbers, setEmptyNumbers] = useState<Contact[]>([]);
  const [invalidNumbers, setInvalidNumbers] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    analyzeContacts();
  }, []);

  const analyzeContacts = async () => {
    setLoading(true);
    const contacts = await getContacts();
    const ignoredMerges: string[] = await getSetting('ignoredMerges') || [];
    
    const phoneGroups: Record<string, Contact[]> = {};
    const nameGroups: Record<string, Contact[]> = {};
    const empty: Contact[] = [];
    const invalid: Contact[] = [];

    contacts.forEach(c => {
      // 1. Empty numbers
      if (!c.phone || c.phone.trim() === '') {
        empty.push(c);
      } 
      // 2. Invalid numbers (less than 5 digits after stripping non-digits)
      else if (c.phone.replace(/\D/g, '').length < 5) {
        invalid.push(c);
      }

      // Exact matches
      if (c.phone) {
        if (!phoneGroups[c.phone]) phoneGroups[c.phone] = [];
        phoneGroups[c.phone].push(c);
      }
      const lowerName = c.name.toLowerCase().trim();
      if (lowerName) {
        if (!nameGroups[lowerName]) nameGroups[lowerName] = [];
        nameGroups[lowerName].push(c);
      }
    });

    const duplicateSets: Contact[][] = [];
    const processedIds = new Set<string>();

    // Add phone duplicates
    Object.values(phoneGroups).forEach(group => {
      if (group.length > 1) {
        const unProcessed = group.filter(c => !processedIds.has(c.id));
        if (unProcessed.length > 1) {
          duplicateSets.push(unProcessed);
          unProcessed.forEach(c => processedIds.add(c.id));
        }
      }
    });

    // Add exact name duplicates
    Object.values(nameGroups).forEach(group => {
      if (group.length > 1) {
        const unProcessed = group.filter(c => !processedIds.has(c.id));
        if (unProcessed.length > 1) {
          duplicateSets.push(unProcessed);
          unProcessed.forEach(c => processedIds.add(c.id));
        }
      }
    });

    // 3. Similar Names (e.g. Rahim vs Md Rahim)
    const similarSets: { id: string, contacts: Contact[] }[] = [];
    const availableForSimilarity = contacts.filter(c => !processedIds.has(c.id));
    
    for (let i = 0; i < availableForSimilarity.length; i++) {
      for (let j = i + 1; j < availableForSimilarity.length; j++) {
        const c1 = availableForSimilarity[i];
        const c2 = availableForSimilarity[j];
        
        const n1 = c1.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const n2 = c2.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (n1 && n2 && n1 !== n2 && (n1.includes(n2) || n2.includes(n1))) {
          // Check if ignored
          const pairId1 = `${c1.id}-${c2.id}`;
          const pairId2 = `${c2.id}-${c1.id}`;
          if (!ignoredMerges.includes(pairId1) && !ignoredMerges.includes(pairId2)) {
            // Make sure they aren't already in a similar set together
            const existingSet = similarSets.find(s => s.contacts.some(c => c.id === c1.id) || s.contacts.some(c => c.id === c2.id));
            if (existingSet) {
              if (!existingSet.contacts.find(c => c.id === c1.id)) existingSet.contacts.push(c1);
              if (!existingSet.contacts.find(c => c.id === c2.id)) existingSet.contacts.push(c2);
            } else {
              similarSets.push({ id: pairId1, contacts: [c1, c2] });
            }
          }
        }
      }
    }

    setEmptyNumbers(empty);
    setInvalidNumbers(invalid);
    setDuplicates(duplicateSets);
    setSimilarNames(similarSets);
    setLoading(false);
  };

  const executeMerge = async (group: Contact[]) => {
    const primary = group[0];
    const others = group.slice(1);

    let mergedName = primary.name;
    let mergedEmail = primary.email;
    let mergedNotes = primary.notes;
    const mergedGroups = new Set(primary.groups);
    let isFavorite = primary.favorite;
    let mergedPhone = primary.phone;

    for (const other of others) {
      if (other.name.toLowerCase() !== mergedName.toLowerCase() && !mergedName.toLowerCase().includes(other.name.toLowerCase()) && !other.name.toLowerCase().includes(mergedName.toLowerCase())) {
        mergedName += ` / ${other.name}`;
      } else if (other.name.length > mergedName.length) {
        // Prefer the longer name (e.g. Md Rahim over Rahim)
        mergedName = other.name;
      }
      if (!mergedPhone && other.phone) mergedPhone = other.phone;
      if (!mergedEmail && other.email) mergedEmail = other.email;
      if (other.notes) mergedNotes += (mergedNotes ? '\n' : '') + other.notes;
      other.groups.forEach(g => mergedGroups.add(g));
      if (other.favorite) isFavorite = true;
    }

    // Update primary
    await saveContact({
      ...primary,
      name: mergedName,
      phone: mergedPhone,
      email: mergedEmail,
      notes: mergedNotes,
      groups: Array.from(mergedGroups),
      favorite: isFavorite
    });

    // Delete others
    for (const other of others) {
      await deleteContact(other.id);
    }
  };

  const handleMergeGroup = async (group: Contact[], index: number, isSimilar: boolean = false) => {
    setMerging(true);
    await executeMerge(group);
    if (isSimilar) {
      setSimilarNames(prev => prev.filter((_, i) => i !== index));
    } else {
      setDuplicates(prev => prev.filter((_, i) => i !== index));
    }
    setMerging(false);
  };

  const handleIgnoreSimilar = async (setId: string, index: number) => {
    const ignoredMerges: string[] = await getSetting('ignoredMerges') || [];
    await saveSetting('ignoredMerges', [...ignoredMerges, setId]);
    setSimilarNames(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteContact = async (id: string, type: 'empty' | 'invalid') => {
    await deleteContact(id);
    if (type === 'empty') {
      setEmptyNumbers(prev => prev.filter(c => c.id !== id));
    } else {
      setInvalidNumbers(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleMergeAll = async () => {
    if (!window.confirm(`Are you sure you want to merge all ${duplicates.length} duplicate groups?`)) return;
    
    setMerging(true);
    for (const group of duplicates) {
      await executeMerge(group);
    }
    setDuplicates([]);
    setMerging(false);
  };

  const totalIssues = duplicates.length + similarNames.length + emptyNumbers.length + invalidNumbers.length;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white ml-2">Auto Cleaner</h1>
        </div>
        {duplicates.length > 1 && (
          <button 
            onClick={handleMergeAll}
            disabled={merging}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
          >
            Merge All Exact
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : totalIssues === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 text-center mt-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Issues Found</h2>
            <p className="text-sm text-gray-500">Your contact list is clean and organized!</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Found <strong>{totalIssues}</strong> issues in your contacts. Review and clean them below.
              </p>
            </div>

            {/* Empty Numbers */}
            {emptyNumbers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {emptyNumbers.length} Contacts with Empty Numbers
                </h3>
                <div className="space-y-3">
                  {emptyNumbers.map(contact => (
                    <div key={contact.id} className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{contact.name}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteContact(contact.id, 'empty')}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invalid Numbers */}
            {invalidNumbers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {invalidNumbers.length} Contacts with Invalid Numbers
                </h3>
                <div className="space-y-3">
                  {invalidNumbers.map(contact => (
                    <div key={contact.id} className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{contact.name}</p>
                        <p className="text-xs text-gray-500 truncate">{contact.phone}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteContact(contact.id, 'invalid')}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exact Duplicates */}
            {duplicates.map((group, index) => (
              <div key={`dup-${index}`} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    {group.length} Exact Duplicates
                  </h3>
                  <button
                    onClick={() => handleMergeGroup(group, index)}
                    disabled={merging}
                    className="flex items-center gap-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-3 py-1.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Merge
                  </button>
                </div>
                
                <div className="space-y-3">
                  {group.map(contact => (
                    <div key={contact.id} className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{contact.name}</p>
                        <p className="text-xs text-gray-500 truncate">{formatPhone(contact.phone)} {contact.email ? `• ${contact.email}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Similar Names */}
            {similarNames.map((set, index) => (
              <div key={set.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    Similar Names
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleIgnoreSimilar(set.id, index)}
                      disabled={merging}
                      className="flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Ignore
                    </button>
                    <button
                      onClick={() => handleMergeGroup(set.contacts, index, true)}
                      disabled={merging}
                      className="flex items-center gap-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 px-3 py-1.5 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors disabled:opacity-50"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      Merge
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {set.contacts.map(contact => (
                    <div key={contact.id} className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{contact.name}</p>
                        <p className="text-xs text-gray-500 truncate">{formatPhone(contact.phone)} {contact.email ? `• ${contact.email}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </div>
  );
}
