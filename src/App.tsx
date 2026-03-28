import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PasskeyScreen from './components/PasskeyScreen';
import ContactsList from './components/ContactsList';
import ContactDetails from './components/ContactDetails';
import AddEditContact from './components/AddEditContact';
import Dialpad from './components/Dialpad';
import CallHistory from './components/CallHistory';
import Groups from './components/Groups';
import CSVImport from './components/CSVImport';
import Profile from './components/Profile';
import Security from './components/Security';
import Messages from './components/Messages';
import MessageCompose from './components/MessageCompose';
import DuplicateCleaner from './components/DuplicateCleaner';
import { getSetting } from './lib/db';
import { useReminderService } from './lib/useReminderService';

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useReminderService();

  useEffect(() => {
    // Check if passkey is disabled (optional feature, but we enforce it by default)
    getSetting('passkeyEnabled').then((enabled) => {
      if (enabled === false) {
        setUnlocked(true);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  if (!unlocked) {
    return <PasskeyScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ContactsList />} />
          <Route path="dialpad" element={<Dialpad />} />
          <Route path="recents" element={<CallHistory />} />
          <Route path="messages" element={<Messages />} />
          <Route path="security" element={<Security />} />
          <Route path="profile" element={<Profile />} />
          
          {/* Full screen routes now inside Layout for quick navigation */}
          <Route path="contact/:id" element={<ContactDetails />} />
          <Route path="add" element={<AddEditContact />} />
          <Route path="edit/:id" element={<AddEditContact />} />
          <Route path="groups" element={<Groups />} />
          <Route path="import" element={<CSVImport />} />
          <Route path="messages/:id" element={<MessageCompose />} />
          <Route path="merge" element={<DuplicateCleaner />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
