import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

export default function CampaignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [waLink, setWaLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  // WhatsApp Send States
  const [waPhone, setWaPhone] = useState('');
  const [waName, setWaName] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waSent, setWaSent] = useState('');

  useEffect(() => {
    loadAll();
  }, [id]);

  const loadAll = async () => {
    try {
      const [campRes, qrRes, waRes] = await Promise.all([
        API.get(`/campaigns/${id}`),
        API.get(`/campaigns/${id}/qr`),
        API.get(`/campaigns/${id}/whatsapp`)
      ]);

      setCampaign(campRes.data);
      setQrData(qrRes.data);
      setWaLink(waRes.data.whatsappLink);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');

    link.download = `QR-${campaign.name.replace(/\s+/g, '-')}.png`;
    link.href = qrData.qr;

    link.click();
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);

    setCopied(label);

    setTimeout(() => {
      setCopied('');
    }, 2000);
  };

  // Send WhatsApp Function
  const sendWhatsApp = async (e) => {
    e.preventDefault();

    setWaSending(true);
    setWaSent('');

    try {
      await API.post('/whatsapp/send-review-request', {
        phone: waPhone,
        patientName: waName,
        campaignId: id
      });

      setWaSent('✅ WhatsApp message sent successfully!');

      setWaPhone('');
      setWaName('');

    } catch (err) {
      setWaSent(
        '❌ ' +
        (err.response?.data?.message || 'Failed to send')
      );
    } finally {
      setWaSending(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!campaign) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-gray-400">
          Campaign not found.
        </div>
      </AdminLayout>
    );
  }

  const statBoxes = [
    {
      label: 'Total Reviews',
      value: campaign.totalReviews,
      icon: '⭐'
    },
    {
      label: 'Sent to Google',
      value: campaign.googleRedirects,
      icon: '✅'
    },
    {
      label: 'Complaints',
      value: campaign.totalComplaints,
      icon: '⚠️'
    },
  ];

  return (
    <AdminLayout>
      <div className="p-8 max-w-5xl">

        {/* Back Button */}
        <button
          onClick={() => navigate('/admin')}
          className="text-gray-400 hover:text-gray-600 text-sm mb-4 flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          {campaign.name}
        </h1>

        <p className="text-gray-400 text-sm mb-6">
          📍 {campaign.location}
          &nbsp;·&nbsp;

          <span
            className={
              campaign.isActive
                ? 'text-green-500'
                : 'text-gray-400'
            }
          >
            {campaign.isActive
              ? '● Active'
              : '○ Inactive'}
          </span>
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statBoxes.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-gray-200 p-5 text-center"
            >
              <p className="text-3xl mb-1">{s.icon}</p>

              <p className="text-3xl font-black text-gray-800">
                {s.value}
              </p>

              <p className="text-sm text-gray-400 mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Main Cards */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* QR Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">

            <h2 className="text-lg font-bold text-gray-800 mb-1">
              QR Code
            </h2>

            <p className="text-sm text-gray-400 mb-5">
              Print and place at reception or OPD.
              Visitors scan to leave a review.
            </p>

            {qrData && (
              <div className="flex flex-col items-center">

                <div className="border-4 border-gray-100 rounded-2xl p-3 shadow-sm mb-4">
                  <img
                    src={qrData.qr}
                    alt="QR Code for reviews"
                    className="w-52 h-52 rounded-lg"
                  />
                </div>

                <p className="text-xs text-gray-300 text-center break-all mb-4 px-2">
                  {qrData.url}
                </p>

                <div className="flex gap-2 w-full">

                  <button
                    onClick={downloadQR}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    ⬇ Download PNG
                  </button>

                  <button
                    onClick={() => copyToClipboard(qrData.url, 'qr')}
                    className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    {copied === 'qr'
                      ? '✓ Copied!'
                      : 'Copy Link'}
                  </button>

                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">

            <h2 className="text-lg font-bold text-gray-800 mb-1">
              WhatsApp Message
            </h2>

            <p className="text-sm text-gray-400 mb-5">
              Send this to patients after billing.
              One tap opens WhatsApp with a pre-written message.
            </p>

            <div className="bg-green-50 border-2 border-green-100 rounded-xl p-4 mb-4">

              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-500 text-lg">💬</span>

                <p className="text-xs font-semibold text-green-700">
                  WhatsApp Share Link
                </p>
              </div>

              <p className="text-xs text-green-600 break-all font-mono leading-relaxed">
                {waLink.substring(0, 100)}...
              </p>
            </div>

            <div className="flex gap-2">

              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors text-center"
              >
                Open WhatsApp
              </a>

              <button
                onClick={() => copyToClipboard(waLink, 'wa')}
                className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                {copied === 'wa'
                  ? 'Copied!'
                  : 'Copy Link'}
              </button>

            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p className="text-xs text-yellow-700">
                💡 <strong>Billing integration tip:</strong>
                {' '}
                Copy this link and paste it into your billing
                software's SMS/WhatsApp template.
                After each patient checkout, send them this link.
              </p>
            </div>

          </div>

        </div>

        {/* Send via Gupshup WhatsApp */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6">

          <h2 className="text-lg font-bold text-gray-800 mb-1">
            Send via Gupshup WhatsApp
          </h2>

          <p className="text-sm text-gray-400 mb-4">
            Send review request directly to patient's WhatsApp number
          </p>

          {waSent && (
            <div
              className={`rounded-xl p-3 text-sm mb-4 ${
                waSent.startsWith('✅')
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {waSent}
            </div>
          )}

          <form
            onSubmit={sendWhatsApp}
            className="flex gap-3"
          >

            <input
              type="text"
              value={waName}
              onChange={(e) => setWaName(e.target.value)}
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 text-sm"
              placeholder="Patient name"
            />

            <input
              type="tel"
              value={waPhone}
              onChange={(e) => setWaPhone(e.target.value)}
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-green-500 text-sm"
              placeholder="91XXXXXXXXXX"
              required
            />

            <button
              type="submit"
              disabled={waSending}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0"
            >
              {waSending
                ? 'Sending...'
                : 'Send 💬'}
            </button>

          </form>
        </div>

      </div>
    </AdminLayout>
  );
}