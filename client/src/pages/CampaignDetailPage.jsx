import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, CheckCircle2, AlertTriangle, Download, Check, MessageCircle, Lightbulb } from 'lucide-react';
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
  const [waSent, setWaSent] = useState(null); // { ok: boolean, text: string }

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
    setWaSent(null);

    try {
      await API.post('/whatsapp/send-review-request', {
        phone: waPhone,
        patientName: waName,
        campaignId: id
      });

      setWaSent({ ok: true, text: 'WhatsApp message sent successfully!' });

      setWaPhone('');
      setWaName('');

    } catch (err) {
      setWaSent({ ok: false, text: err.response?.data?.message || 'Failed to send' });
    } finally {
      setWaSending(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!campaign) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-slate-400">
          Campaign not found.
        </div>
      </AdminLayout>
    );
  }

  const statBoxes = [
    { label: 'Total Reviews',  value: campaign.totalReviews,    Icon: Star },
    { label: 'Sent to Google', value: campaign.googleRedirects, Icon: CheckCircle2 },
    { label: 'Complaints',     value: campaign.totalComplaints, Icon: AlertTriangle },
  ];

  return (
    <AdminLayout>
      <div className="p-8 max-w-5xl">

        {/* Back Button */}
        <button
          onClick={() => navigate('/admin')}
          className="text-slate-500 hover:text-slate-700 text-sm mb-4 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} /> Back to Dashboard
        </button>

        {/* Title */}
        <h1 className="text-xl font-semibold text-slate-900 mb-1">
          {campaign.name}
        </h1>

        <p className="text-slate-500 text-sm mb-6 flex items-center gap-2">
          {campaign.location}
          <span className="text-slate-300">·</span>
          <span className={campaign.isActive ? 'text-green-600' : 'text-slate-400'}>
            {campaign.isActive ? 'Active' : 'Inactive'}
          </span>
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statBoxes.map(({ label, value, Icon }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-slate-200 p-5 text-center"
            >
              <Icon className="w-5 h-5 text-slate-400 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-2xl font-semibold text-slate-900">
                {value}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Main Cards */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* QR Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">

            <h2 className="text-base font-semibold text-slate-900 mb-1">
              QR Code
            </h2>

            <p className="text-sm text-slate-500 mb-5">
              Print and place at reception or OPD.
              Visitors scan to leave a review.
            </p>

            {qrData && (
              <div className="flex flex-col items-center">

                <div className="border border-slate-100 rounded-xl p-3 mb-4">
                  <img
                    src={qrData.qr}
                    alt="QR Code for reviews"
                    className="w-52 h-52 rounded-lg"
                  />
                </div>

                <p className="text-xs text-slate-400 text-center break-all mb-4 px-2">
                  {qrData.url}
                </p>

                <div className="flex gap-2 w-full">

                  <button
                    onClick={downloadQR}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" strokeWidth={1.75} /> Download PNG
                  </button>

                  <button
                    onClick={() => copyToClipboard(qrData.url, 'qr')}
                    className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    {copied === 'qr' ? <><Check className="w-4 h-4" strokeWidth={1.75} /> Copied!</> : 'Copy Link'}
                  </button>

                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">

            <h2 className="text-base font-semibold text-slate-900 mb-1">
              WhatsApp Message
            </h2>

            <p className="text-sm text-slate-500 mb-5">
              Send this to patients after billing.
              One tap opens WhatsApp with a pre-written message.
            </p>

            <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4">

              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-green-600" strokeWidth={1.75} />
                <p className="text-xs font-semibold text-green-700">
                  WhatsApp Share Link
                </p>
              </div>

              <p className="text-xs text-green-700 break-all font-mono leading-relaxed">
                {waLink.substring(0, 100)}...
              </p>
            </div>

            <div className="flex gap-2">

              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors text-center"
              >
                Open WhatsApp
              </a>

              <button
                onClick={() => copyToClipboard(waLink, 'wa')}
                className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                {copied === 'wa' ? 'Copied!' : 'Copy Link'}
              </button>

            </div>

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <p className="text-xs text-amber-800">
                <strong>Billing integration tip:</strong>
                {' '}
                Copy this link and paste it into your billing
                software's SMS/WhatsApp template.
                After each patient checkout, send them this link.
              </p>
            </div>

          </div>

        </div>

        {/* Send via Gupshup WhatsApp */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">

          <h2 className="text-base font-semibold text-slate-900 mb-1">
            Send via Gupshup WhatsApp
          </h2>

          <p className="text-sm text-slate-500 mb-4">
            Send review request directly to patient's WhatsApp number
          </p>

          {waSent && (
            <div
              className={`rounded-lg p-3 text-sm mb-4 ${
                waSent.ok
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {waSent.text}
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
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-500 text-sm"
              placeholder="Patient name"
            />

            <input
              type="tel"
              value={waPhone}
              onChange={(e) => setWaPhone(e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-500 text-sm"
              placeholder="91XXXXXXXXXX"
              required
            />

            <button
              type="submit"
              disabled={waSending}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-lg text-sm font-medium flex-shrink-0 transition-colors"
            >
              {waSending ? 'Sending...' : 'Send'}
            </button>

          </form>
        </div>

      </div>
    </AdminLayout>
  );
}
