import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { QrCodeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NewInstance() {
  const navigate = useNavigate();
  const [instanceName, setInstanceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState('input'); // input, creating, qr_ready, connected
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus('creating');

    try {
      const response = await api.post('/instances', { instanceName });
      setQrCode(response.data.instance.qrCode);
      setStatus('qr_ready');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create instance');
      setStatus('input');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    navigate('/instances');
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate('/instances')} className="text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Connect New Instance</h1>
      </div>

      <div className="card max-w-lg mx-auto">
        <div className="card-body p-8">
          {status === 'input' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
                  <span className="text-3xl">📱</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Add WhatsApp Number</h2>
                <p className="text-gray-500 mt-1">Enter a name to identify this device</p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instance Name</label>
                <input
                  type="text"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Support Line, Marketing Team"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Creating Instance...' : 'Generate QR Code'}
              </button>
            </form>
          )}

          {status === 'creating' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Connecting to Evolution API...</p>
            </div>
          )}

          {status === 'qr_ready' && (
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Scan QR Code</h2>
                <p className="text-gray-500 text-sm">Open WhatsApp &gt; Settings &gt; Linked Devices</p>
              </div>

              <div className="bg-white p-4 border-2 border-gray-100 rounded-xl inline-block shadow-sm">
                {qrCode ? (
                  <img 
                    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                    alt="QR Code" 
                    className="w-64 h-64 object-contain" 
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-gray-50 text-gray-400">
                    <QrCodeIcon className="w-12 h-12" />
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm text-left">
                <p className="font-medium flex items-center gap-2">
                  <span className="text-lg">💡</span> Note:
                </p>
                <ul className="list-disc list-inside mt-1 ml-1 space-y-1">
                  <li>Keep this page open while scanning</li>
                  <li>Instance status will update automatically</li>
                </ul>
              </div>

              <button onClick={handleDone} className="btn-primary w-full">
                I've Scanned It
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
