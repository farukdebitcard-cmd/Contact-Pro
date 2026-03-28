import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { getContacts, saveContact, Contact } from '../lib/db';
import { normalizePhone } from '../lib/phone';

const getNormalizedValue = (row: any, possibleKeys: string[]) => {
  const normalizedRow: Record<string, string> = {};
  for (const key in row) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    normalizedRow[normalizedKey] = row[key];
  }
  for (const key of possibleKeys) {
    if (normalizedRow[key] !== undefined && normalizedRow[key] !== null && normalizedRow[key] !== '') {
      return String(normalizedRow[key]).trim();
    }
  }
  return '';
};

const NAME_KEYS = ['name', 'fullname', 'firstname', 'contactname', 'displayname'];
const PHONE_KEYS = ['phone', 'mobile', 'cell', 'telephone', 'phonenumber', 'contactnumber', 'number'];
const EMAIL_KEYS = ['email', 'emailaddress', 'mail'];
const GROUP_KEYS = ['group', 'groups', 'category', 'tags', 'label', 'labels'];
const NOTE_KEYS = ['note', 'notes', 'description', 'comments', 'memo'];

export default function CSVImport() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ added: number; merged: number; failed: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreview(results.data.slice(0, 5)); // Show first 5
        }
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const existingContacts = await getContacts();
        let added = 0;
        let merged = 0;
        let failed = 0;

        for (const row of results.data as any[]) {
          const name = getNormalizedValue(row, NAME_KEYS);
          const rawPhone = getNormalizedValue(row, PHONE_KEYS);
          const email = getNormalizedValue(row, EMAIL_KEYS);
          const groupStr = getNormalizedValue(row, GROUP_KEYS);
          const notes = getNormalizedValue(row, NOTE_KEYS);

          if (!name || !rawPhone) {
            failed++;
            continue;
          }

          const normPhone = normalizePhone(rawPhone);
          const groups = groupStr ? groupStr.split(',').map((g: string) => g.trim()) : [];

          // Check for existing contact by normalized phone
          const existing = existingContacts.find(c => c.phone === normPhone);

          if (existing) {
            // Merge logic
            const mergedName = existing.name.toLowerCase() === name.toLowerCase() 
              ? existing.name 
              : `${existing.name} / ${name}`;
            
            const mergedGroups = Array.from(new Set([...existing.groups, ...groups]));
            const mergedNotes = existing.notes ? `${existing.notes}\n${notes}` : notes;

            await saveContact({
              ...existing,
              name: mergedName,
              groups: mergedGroups,
              notes: mergedNotes,
              email: existing.email || email,
            });
            merged++;
          } else {
            // Add new
            await saveContact({
              name,
              phone: normPhone,
              email,
              groups,
              notes,
              favorite: false,
            });
            added++;
          }
        }

        setResult({ added, merged, failed });
        setImporting(false);
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center p-4 bg-white dark:bg-gray-900 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white ml-2">Import CSV</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {!result ? (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 text-center">
              <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Upload Contacts CSV</h2>
              <p className="text-sm text-gray-500 mb-6">File should have headers: Name, Phone, Email, Groups, Notes</p>
              
              <label className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium cursor-pointer hover:bg-blue-700 transition-colors inline-block">
                Select File
                <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            {preview.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Preview (First 5 rows)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                      <tr>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Phone</th>
                        <th className="px-4 py-2">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b dark:border-gray-700">
                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{getNormalizedValue(row, NAME_KEYS) || '-'}</td>
                          <td className="px-4 py-2">{getNormalizedValue(row, PHONE_KEYS) || '-'}</td>
                          <td className="px-4 py-2">{getNormalizedValue(row, EMAIL_KEYS) || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full mt-6 bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Start Import & Merge'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Import Complete</h2>
            
            <div className="space-y-2 mt-6 text-left max-w-xs mx-auto">
              <div className="flex justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400">
                <span>New Added:</span>
                <span className="font-bold">{result.added}</span>
              </div>
              <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-400">
                <span>Merged:</span>
                <span className="font-bold">{result.merged}</span>
              </div>
              {result.failed > 0 && (
                <div className="flex justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400">
                  <span>Failed (Missing data):</span>
                  <span className="font-bold">{result.failed}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/')}
              className="mt-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Back to Contacts
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
