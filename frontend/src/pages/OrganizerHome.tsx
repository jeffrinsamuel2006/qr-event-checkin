import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import QRScanner from '../components/QRScanner';

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

// Scanner-specific states
type ScannerState = 'closed' | 'scanning' | 'processing' | 'result';

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

  // Scanner state
  const [scannerState, setScannerState] = useState<ScannerState>('closed');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<CheckinResponse | null>(null);
  const isProcessingScanRef = useRef(false);

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

  // Submit check-in (used by both manual and scanner)
  const submitCheckin = async (code: string): Promise<CheckinResponse> => {
    const response = await fetch(`${API_BASE_URL}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ attendeeCode: code }),
    });

    return await response.json();
  };

  // Manual check-in handler
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
      const data = await submitCheckin(code);

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setCheckinData(data.checkin || null);
        setAttendeeCode('');
        await fetchDashboard();
      } else if (data.result === 'DUPLICATE') {
        setStatus('duplicate');
        setMessage(data.message || 'Already checked in');
        setCheckinData(null);
      } else if (data.result === 'UNKNOWN_ATTENDEE') {
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

  // Scanner scan handler
  const handleScannerScan = useCallback(async (decodedText: string) => {
    // Prevent repeated scans
    if (isProcessingScanRef.current) return;
    isProcessingScanRef.current = true;

    setScannerState('processing');
    setScannerError(null);
    setScanResult(null);

    try {
      const data = await submitCheckin(decodedText);
      setScanResult(data);
      setScannerState('result');
    } catch {
      setScanResult({
        success: false,
        message: 'Check-in service temporarily unavailable',
        result: 'SERVER_ERROR',
      });
      setScannerState('result');
    }
  }, [token]);

  // Scanner error handler
  const handleScannerError = useCallback((errorMessage: string) => {
    setScannerError(errorMessage);
    setScannerState('closed');
  }, []);

  // Scan next handler
  const handleScanNext = () => {
    isProcessingScanRef.current = false;
    setScanResult(null);
    setScannerError(null);
    setScannerState('scanning');
  };

  // Open scanner
  const handleOpenScanner = () => {
    isProcessingScanRef.current = false;
    setScanResult(null);
    setScannerError(null);
    setScannerState('scanning');
  };

  // Close scanner
  const handleCloseScanner = () => {
    isProcessingScanRef.current = false;
    setScanResult(null);
    setScannerError(null);
    setScannerState('closed');
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

  const getScanResultColor = (result: string) => {
    switch (result) {
      case 'SUCCESS': return 'text-green-700 bg-green-50 border-green-200';
      case 'DUPLICATE': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'UNKNOWN_ATTENDEE': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-red-700 bg-red-50 border-red-200';
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

        {/* Check-In Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Check-In Attendee</h2>

          {/* Scanner Button */}
          {scannerState === 'closed' && (
            <button
              onClick={handleOpenScanner}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 mb-4"
            >
              📷 Scan QR Code
            </button>
          )}

          {/* Scanner Modal */}
          {scannerState !== 'closed' && (
            <div className="mb-4 border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-700">Scan Attendee QR</h3>
                <button
                  onClick={handleCloseScanner}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Close Scanner
                </button>
              </div>

              {/* Camera Preview */}
              {scannerState === 'scanning' && (
                <div className="mb-3">
                  <QRScanner
                    onScan={handleScannerScan}
                    onError={handleScannerError}
                    isActive={true}
                  />
                  <p className="text-sm text-gray-500 text-center mt-2">Align QR inside frame</p>
                </div>
              )}

              {/* Processing State */}
              {scannerState === 'processing' && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Processing...</p>
                </div>
              )}

              {/* Result State */}
              {scannerState === 'result' && scanResult && (
                <div className={`p-4 rounded-md border ${getScanResultColor(scanResult.result)}`}>
                  {scanResult.result === 'SUCCESS' && (
                    <>
                      <p className="font-medium">✓ Check-in successful</p>
                      {scanResult.checkin && (
                        <div className="mt-2 text-sm space-y-1">
                          <p><span className="font-medium">Attendee Code:</span> {scanResult.checkin.attendeeCode}</p>
                          <p><span className="font-medium">Checked In At:</span> {new Date(scanResult.checkin.checkedInAt).toLocaleString()}</p>
                        </div>
                      )}
                    </>
                  )}
                  {scanResult.result === 'DUPLICATE' && (
                    <p className="font-medium">Already checked in</p>
                  )}
                  {scanResult.result === 'UNKNOWN_ATTENDEE' && (
                    <p className="font-medium">Unknown attendee code</p>
                  )}
                  {scanResult.result === 'SERVER_ERROR' && (
                    <p className="font-medium">Check-in service temporarily unavailable</p>
                  )}

                  <button
                    onClick={handleScanNext}
                    className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Scan Next
                  </button>
                </div>
              )}

              {/* Scanner Error */}
              {scannerError && (
                <div className="p-4 rounded-md border text-red-700 bg-red-50 border-red-200">
                  <p className="font-medium">{scannerError}</p>
                  <button
                    onClick={handleOpenScanner}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-gray-500 text-sm">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Manual Check-in Form */}
          <p className="text-sm text-gray-500 mb-2">Enter attendee code manually</p>
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

          {/* Manual Check-in Result */}
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
