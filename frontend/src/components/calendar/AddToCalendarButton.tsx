import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { prepareCalendarEvent, getICSDownloadUrl } from '@/lib/queries';
import type { Bet } from '@/lib/schemas';

interface AddToCalendarButtonProps {
  bet: Bet;
  onSuccess?: () => void;
}

export default function AddToCalendarButton({ bet, onSuccess }: AddToCalendarButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if already added to calendar
  const isAdded = !!bet.calendar_provider;

  // Check if event date exists
  const hasEventDate = !!bet.event_date;

  const handleProviderSelect = async (provider: 'google' | 'ics' | 'outlook') => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await prepareCalendarEvent(bet.id, provider);

      if (response.status === 'duplicate') {
        setMessage({
          type: 'error',
          text: response.message || 'This bet is already added to your calendar.',
        });
        setIsOpen(false);
        return;
      }

      // Handle ICS download
      if (response.action === 'download-ics' && response.downloadUrl) {
        // Trigger download
        const downloadUrl = getICSDownloadUrl(bet.id);
        window.location.href = downloadUrl;

        setMessage({
          type: 'success',
          text: 'Calendar event downloaded! Open the file to add it to your calendar.',
        });
        setIsOpen(false);

        if (onSuccess) {
          setTimeout(() => onSuccess(), 500);
        }
      } else {
        setMessage({
          type: 'success',
          text: response.message || 'Calendar event created!',
        });
        setIsOpen(false);

        if (onSuccess) {
          setTimeout(() => onSuccess(), 500);
        }
      }
    } catch (err: any) {
      console.error('Failed to add to calendar:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to add event to calendar. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        disabled={!hasEventDate || isAdded}
        variant="outline"
        size="sm"
        title={
          !hasEventDate
            ? 'This bet needs an event date to add to calendar'
            : isAdded
            ? `Already added to ${bet.calendar_provider} calendar`
            : 'Add to calendar'
        }
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {isAdded ? 'Added to Calendar' : 'Add to Calendar'}
      </Button>

      {message && (
        <div
          className={`mt-2 p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4">
              <h3 className="font-medium text-sm mb-3">Choose Calendar App</h3>

              <div className="space-y-2">
                <button
                  onClick={() => handleProviderSelect('ics')}
                  disabled={loading}
                  className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium text-sm">Apple Calendar</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Download .ics file for iOS/macOS
                  </div>
                </button>

                <button
                  onClick={() => handleProviderSelect('ics')}
                  disabled={loading}
                  className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium text-sm">Google Calendar</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Download .ics file to import
                  </div>
                </button>

                <button
                  onClick={() => handleProviderSelect('ics')}
                  disabled={loading}
                  className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium text-sm">Outlook</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Download .ics file for Outlook
                  </div>
                </button>
              </div>

              {loading && (
                <div className="mt-3 text-center text-sm text-gray-600">
                  Preparing calendar event...
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
