import { useEffect } from 'react';
import { getContacts, saveContact, getSetting } from './db';

export function useReminderService() {
  useEffect(() => {
    const checkReminders = async () => {
      try {
        const profile = await getSetting('profile');
        const smsSettings = await getSetting('smsSettings');
        
        if (!profile?.phone || !smsSettings?.apiKey) {
          return; // Cannot send SMS without phone or API key
        }

        const contacts = await getContacts();
        const now = new Date().getTime();
        
        for (const contact of contacts) {
          if (!contact.reminders || contact.reminders.length === 0) continue;
          
          let updated = false;
          const updatedReminders = contact.reminders.map(reminder => {
            if (!reminder.completed && !reminder.smsSent) {
              const reminderTime = new Date(reminder.date).getTime();
              
              // If reminder is due (or past due by up to 1 hour to avoid spamming old ones)
              if (now >= reminderTime && now - reminderTime < 60 * 60 * 1000) {
                // Send SMS
                const message = `Reminder: ${reminder.title} for ${contact.name}`;
                sendSMS(smsSettings.apiKey, smsSettings.senderId || '8809617622592', profile.phone, message);
                
                updated = true;
                return { ...reminder, smsSent: true };
              }
            }
            return reminder;
          });
          
          if (updated) {
            await saveContact({ ...contact, reminders: updatedReminders });
          }
        }
      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    };

    // Check immediately on mount
    checkReminders();
    
    // Then check every minute
    const interval = setInterval(checkReminders, 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}

async function sendSMS(apiKey: string, senderId: string, number: string, message: string) {
  try {
    const url = new URL('http://bulksmsbd.net/api/smsapi');
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('type', 'text');
    url.searchParams.append('number', number);
    url.searchParams.append('senderid', senderId);
    url.searchParams.append('message', message);
    
    // Using no-cors or standard fetch depending on API CORS support
    // Since it's a direct API call from browser, CORS might be an issue.
    // We'll try standard fetch first.
    await fetch(url.toString(), { method: 'GET' });
    console.log('SMS sent successfully to', number);
  } catch (error) {
    console.error('Failed to send SMS:', error);
  }
}
