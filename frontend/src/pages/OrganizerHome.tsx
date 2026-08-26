import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface DashboardEvent {
  id: string;
  name: string;
  description: string | null;
  eventDate: string;
  status: string;
}

interface Attendance {
  totalRegistered: number;
  totalCheckedIn: number;
  remaining: number;
  percentage: number;
}

interface CheckedInAttendee {
  attendeeId: string;
  name: string;
  attendeeCode: string;
  checkedInAt: string;
  scannedBy: string;
}

interface DashboardResponse {
  success: boolean;
  event: DashboardEvent;
  attendance: Attendance;
  checkedInAttendees: CheckedInAttendee[];
}

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
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Check-in form state
  const [attendeeCode, setAttendeeCode] = useState('');
  const [status, setStatus] = useState<CheckinStatus>('idle');
  const [message, setMessage] = useState('');
  const [checkinData, setCheckinData] = useState<CheckinResponse['checkin'] | null>(null);

  const fetchedRef = useRef(false);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/organizer/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (response.status === 403) {
        setDashboardError('You do not have permission to access the organizer dashboard.');
        return;
      }

      if (response.status === 404) {
        setDashboardError('No active event found.');
        return;
      }

      if (!response.ok) {
        setDashboardError('Unable to load attendance data.');
        return;
      }

      const data: DashboardResponse = await response.json();
      setDashboard(data);
    } catch {
      setDashboardError('Unable to load attendance data.');
    } finally {
      setDashboardLoading(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchDashboard();
    }
  }, [fetchDashboard]);

  const handleRefresh = async () => {
    await fetchDashboard();
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
        // Refresh dashboard to get updated counts from database
        await fetchDashboard();
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

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  // Loading state
  if (dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 text-lg">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dashboardError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Organizer Dashboard</h1>
          <p className="text-red-600 mb-6">{dashboardError}</p>
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

  if (!dashboard) return null;

  const { event, attendance, checkedInAttendees } = dashboard;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Organizer Dashboard</h1>
              <p className="text-gray-600">Event: <span className="font-medium">{event.name}</span></p>
              <p className="text-gray-500 text-sm mt-1">
                Status: <span className={`font-medium ${event.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'}`}>{event.status}</span>
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-sm text-gray-500">Total Registered</p>
            <p className="text-3xl font-bold text-gray-800">{attendance.totalRegistered}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-sm text-gray-500">Checked In</p>
            <p className="text-3xl font-bold text-green-600">{attendance.totalCheckedIn}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-sm text-gray-500">Remaining</p>
            <p className="text-3xl font-bold text-yellow-600">{attendance.remaining}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-sm text-gray-500">Attendance</p>
            <p className="text-3xl font-bold text-blue-600">{attendance.percentage}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-500 mb-2">
            Checked In: {attendance.totalCheckedIn} / {attendance.totalRegistered}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${attendance.percentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">{attendance.percentage}%</p>
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
                  <p><span className="font-medium">Checked In At:</span> {new Date(checkinData.checkedInAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Checked-In Attendees Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Checked-In Attendees</h2>

          {checkedInAttendees.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No attendees have checked in yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium text-gray-600">Name</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-600">Attendee Code</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-600">Check-in Time</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-600">Scanned By</th>
                  </tr>
                </thead>
                <tbody>
                  {checkedInAttendees.map((attendee) => (
                    <tr key={attendee.attendeeId} className="border-b last:border-b-0">
                      <td className="py-2 px-2">{attendee.name}</td>
                      <td className="py-2 px-2 font-mono">{attendee.attendeeCode}</td>
                      <td className="py-2 px-2">{new Date(attendee.checkedInAt).toLocaleString()}</td>
                      <td className="py-2 px-2">{attendee.scannedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
