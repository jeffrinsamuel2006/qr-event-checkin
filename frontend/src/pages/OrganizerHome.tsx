import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface CheckinResponse {
  success: boolean;
  message: string;
  result: string;
  checkin?: {
    id: string;
    attendeeCode: string;
    eventId: string;
    checkedInAt: string;
  };
}

type CheckinStatus = 'idle' | 'loading' | 'success' | 'duplicate' | 'unknown' | 'error';

export default function OrganizerHome() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [attendeeCode, setAttendeeCode] = useState('');
  const [status, setStatus] = useState<CheckinStatus>('idle');
  const [message, setMessage] = useState('');
  const [checkinData, setCheckinData] = useState<CheckinResponse['checkin'] | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const code = attendeeCode.trim();
    if (!code) {
      setStatus('error');
      setMessage('Please enter an attendee code');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attendeeCode: code }),
      });

      const data: CheckinResponse = await response.json();

      if (response.status === 200 && data.success) {
        setStatus('success');
        setMessage(data.message);
        setCheckinData(data.checkin || null);
        setAttendeeCode('');
      } else if (response.status === 409) {
        setStatus('duplicate');
        setMessage(data.message || 'Already checked in');
        setCheckinData(null);
      } else if (response.status === 404) {
        setStatus('unknown');
        setMessage(data.message || 'Unknown attendee code');
        setCheckinData(null);
      } else {
        setStatus('error');
        setMessage(data.message || 'Check-in service temporarily unavailable');
        setCheckinData(null);
      }
    } catch {
      setStatus('error');
      setMessage('Check-in service temporarily unavailable');
      setCheckinData(null);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'duplicate': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'unknown': return 'text-red-700 bg-red-50 border-red-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Organizer Portal</h1>
          <p className="text-gray-500">Welcome, {user?.name}</p>
        </div>

        {/* Check-In Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Check-In Attendee</h2>
          
          <form onSubmit={handleCheckin} className="space-y-4">
            <div>
              <label htmlFor="attendeeCode" className="block text-sm font-medium text-gray-700 mb-1">
                Attendee Code
              </label>
              <input
                id="attendeeCode"
                type="text"
                value={attendeeCode}
                onChange={(e) => {
                  setAttendeeCode(e.target.value);
                  if (status !== 'idle') {
                    setStatus('idle');
                    setMessage('');
                  }
                }}
                placeholder="e.g., ATT-001"
                disabled={status === 'loading'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || !attendeeCode.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Checking in...' : 'Check In'}
            </button>
          </form>

          {/* Result Display */}
          {message && status !== 'idle' && (
            <div className={`mt-4 p-4 rounded-md border ${getStatusColor()}`}>
              <p className="font-medium">{message}</p>
              {status === 'success' && checkinData && (
                <div className="mt-2 text-sm space-y-1">
                  <p><span className="font-medium">Attendee Code:</span> {checkinData.attendeeCode}</p>
                  <p><span className="font-medium">Event ID:</span> {checkinData.eventId}</p>
                  <p><span className="font-medium">Checked In At:</span> {new Date(checkinData.checkedInAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
