import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth, getParticipantMe, ParticipantApiError } from '../auth';
import type { Registration, EventData } from '../auth';

interface ParticipantData {
  participant: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  registration: Registration;
}

export default function ParticipantHome() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ParticipantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getParticipantMe(token);
      setData(response);
    } catch (err) {
      if (err instanceof ParticipantApiError) {
        if (err.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        if (err.status === 403) {
          setError('You do not have permission to access this page.');
        } else if (err.status === 404) {
          setError('No event registration found.');
        } else {
          setError('Unable to load event information. Please try again.');
        }
      } else {
        setError('Unable to load event information. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchData();
    }
  }, [fetchData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('participant-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `qr-${data?.registration.attendeeCode || 'ticket'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 text-lg">Loading your event...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Participant Portal</h1>
          <p className="text-red-600 mb-6">{error}</p>
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

  if (!data) return null;

  const { participant, registration } = data;
  const event: EventData = registration.event;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Participant Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{participant.name}</h1>
          <p className="text-gray-500 mb-4">{participant.email}</p>

          <div className="border-t pt-4 mt-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">{event.name}</h2>
            {event.description && (
              <p className="text-gray-600 text-sm mb-2">{event.description}</p>
            )}
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Date:</span>{' '}
              {new Date(event.eventDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-gray-600 text-sm">
              <span className="font-medium">Status:</span>{' '}
              <span className={`font-medium ${event.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'}`}>
                {event.status}
              </span>
            </p>
          </div>

          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Check-in status:</span>{' '}
              <span className="text-yellow-600">Not checked in</span>
            </p>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-500 mb-1">Your Attendee Code</p>
          <p className="text-xl font-mono font-bold text-gray-800 mb-4">{registration.attendeeCode}</p>

          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
              <QRCodeSVG
                id="participant-qr"
                value={registration.attendeeCode}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mb-4">
            Show this QR code at the event entrance.
          </p>

          <button
            onClick={handleDownloadQR}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Download QR
          </button>
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
