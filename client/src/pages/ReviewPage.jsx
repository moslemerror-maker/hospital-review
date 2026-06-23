import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import API from '../api';

// ─── These MUST live outside ReviewPage ──────────────────────────────────────
// Moving them outside prevents remounting on every state change (fixes input bug)

function StarSelector({ rating, hovered, onSelect, onHover, onLeave }) {
  return (
    <div className="flex justify-center gap-2 my-6">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || rating);
        return (
          <button
            key={star}
              
            onClick={() => onSelect(star)}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={onLeave}
            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
            aria-label={`${star} star`}
          >
            <svg width="52" height="52" viewBox="0 0 24 24"
              fill={filled ? '#FBBF24' : '#E5E7EB'}
              style={{ filter: filled ? 'drop-shadow(0 2px 4px rgba(251,191,36,0.4))' : 'none', transition: 'all 0.15s' }}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
        );
      })}
    </div>
  );
}

function PageShell({ name, location, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-8 py-6 text-white text-center">
          <div className="text-4xl mb-2">🏥</div>
          <h1 className="text-xl font-bold">{name || 'Marwari Hospital'}</h1>
          {location && <p className="text-blue-200 text-sm mt-1">📍 {location}</p>}
        </div>
        <div className="px-8 py-6">{children}</div>
      </div>
    </div>
  );
}

const RATING_LABELS = {
  1: { text: 'Very Poor',  emoji: '😞', color: 'text-red-500'    },
  2: { text: 'Poor',       emoji: '😕', color: 'text-orange-500' },
  3: { text: 'Average',    emoji: '😐', color: 'text-yellow-500' },
  4: { text: 'Good',       emoji: '😊', color: 'text-blue-500'   },
  5: { text: 'Excellent!', emoji: '😄', color: 'text-green-500'  },
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function ReviewPage() {
  const { campaignId }  = useParams();
  const [searchParams]  = useSearchParams();
  const source          = searchParams.get('source') || 'direct';

  const [campaign,    setCampaign]    = useState(null);
  const [pageStatus,  setPageStatus]  = useState('loading');

  // 'rating'    → star picker
  // 'complaint' → complaint form (1–3 stars)
  // 'done'      → complaint submitted
  const [step,        setStep]        = useState('rating');

  const [rating,      setRating]      = useState(0);
  const [hovered,     setHovered]     = useState(0);
  const [visitorName, setVisitorName] = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Complaint form
  const [description, setDescription] = useState('');
  const [phone,       setPhone]       = useState('');
  const [department,  setDepartment]  = useState('');
  const [compError,   setCompError]   = useState('');
  const [googleUrl,   setGoogleUrl] = useState('');

  useEffect(() => {
    API.get(`/reviews/campaign/${campaignId}`)
      .then(res  => { setCampaign(res.data); setPageStatus('ready'); })
      .catch(err => {
        setPageStatus(
          err.response?.status === 404 || err.response?.status === 403
            ? 'not_found' : 'error'
        );
      });
  }, [campaignId]);

  // ── Submit star rating ──────────────────────────────────────────────────────
  const handleRatingSubmit = async () => {
    if (rating === 0) return;
    setSubmitError('');
    setSubmitting(true);

    try {
      const res = await API.post('/reviews/submit', {
        campaignId,
        visitorName: visitorName.trim() || 'Anonymous',
        rating,
        source
      });

      if (res.data.action === 'redirect_google') {
        // ── 4 or 5 stars: send the visitor to Google to leave a review ─────
        // NOTE: Google does not allow pre-selecting stars via URL — this is
        // a hard Google security rule. The page opens on the review form
        // and the visitor selects stars themselves.
        //
        // We deliberately do NOT auto-navigate via window.location.href here.
        // Android App Links / iOS Universal Links — which hand this off to
        // the native Google Maps app instead of the browser — are only
        // reliably honored on a genuine, direct tap on a real <a href> link,
        // not a script-triggered redirect. So the next screen renders a real
        // anchor tag as the primary CTA instead of auto-redirecting.
        setGoogleUrl(res.data.googleUrl);
        setStep('google_opened');

      } else {
        // ── 3 stars or below: show complaint form ─────────────────────────
        setStep('complaint');
      }

    } catch (err) {
      // Show error inline instead of alert() so it doesn't block the UI
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submit complaint ────────────────────────────────────────────────────────
  const handleComplaintSubmit = async () => {
    setCompError('');
    if (!description.trim()) {
      setCompError('Please describe your experience before submitting.');
      return;
    }
    if (!phone.trim()) {
      setCompError('Please provide a contact number so our team can follow up.');
      return;
    }
    setSubmitting(true);

    try {
      await API.post('/complaints', {
        campaignId,
        visitorName: visitorName.trim() || 'Anonymous',
        phone:       phone.trim(),
        rating,
        description: description.trim(),
        department:  department.trim()
      });
      setStep('done');
    } catch (err) {
      setCompError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / error states ──────────────────────────────────────────────────
  if (pageStatus === 'loading') return (
    <PageShell name={null} location={null}>
      <div className="text-center py-10">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"/>
        <p className="text-gray-400 text-sm mt-3">Loading...</p>
      </div>
    </PageShell>
  );

  if (pageStatus === 'not_found') return (
    <PageShell name="Marwari Hospital" location={null}>
      <div className="text-center py-10">
        <p className="text-5xl mb-4">🔗</p>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Link Not Active</h2>
        <p className="text-gray-400 text-sm">This review link is no longer available.</p>
      </div>
    </PageShell>
  );

  if (pageStatus === 'error') return (
    <PageShell name="Marwari Hospital" location={null}>
      <div className="text-center py-10">
        <p className="text-5xl mb-4">⚠️</p>
        <p className="text-gray-400 text-sm">Something went wrong. Please try again.</p>
      </div>
    </PageShell>
  );

  // ── STEP: Star rating picker ────────────────────────────────────────────────
  if (step === 'rating') return (
    <PageShell name={campaign?.name} location={campaign?.location}>
      <h2 className="text-xl font-bold text-gray-800 text-center">
        How was your experience?
      </h2>
      <p className="text-gray-400 text-sm text-center mt-1">
        Tap a star to rate your visit
      </p>

      <StarSelector
        rating={rating}
        hovered={hovered}
        onSelect={setRating}
        onHover={setHovered}
        onLeave={() => setHovered(0)}
      />

      {/* Dynamic label */}
      <div className="h-8 text-center mb-4">
        {rating > 0 && (
          <p className={`text-base font-semibold ${RATING_LABELS[rating].color}`}>
            {RATING_LABELS[rating].emoji} {RATING_LABELS[rating].text}
          </p>
        )}
      </div>

      {/* Inline error — no more alert() */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm mb-4">
          ⚠ {submitError}
        </div>
      )}

      {/* Name field — input focus bug is fixed by PageShell being outside */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-600 mb-1.5">
          Your Name <span className="text-gray-300 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={visitorName}
          onChange={(e) => setVisitorName(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-gray-800"
          placeholder="Enter your name"
          maxLength={60}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
      </div>

      <button
        type="button"
        onClick={handleRatingSubmit}
        disabled={rating === 0 || submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
            Please wait...
          </span>
        ) : 'Submit Rating'}
      </button>

      {rating === 0 && (
        <p className="text-center text-gray-300 text-xs mt-3">
          Select a rating above to continue
        </p>
      )}
    </PageShell>
  );

  // ── STEP: Opened Google (4–5 stars) ────────────────────────────────────────
  // Lightweight screen — no intermediate steps
  if (step === 'google_opened') return (
    <PageShell name={campaign?.name} location={campaign?.location}>
      <div className="text-center py-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Thank You!</h2>

        {/* Show their stars */}
        <div className="flex justify-center gap-1 my-3">
          {[1,2,3,4,5].map((s) => (
            <svg key={s} width="28" height="28" viewBox="0 0 24 24"
              fill={s <= rating ? '#FBBF24' : '#E5E7EB'}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ))}
        </div>

        <p className="text-gray-500 text-sm mb-1">
          One last tap to post your review on Google.
        </p>
        <p className="text-gray-400 text-xs mb-6">
          Please select <strong>{rating} star{rating > 1 ? 's' : ''}</strong> there and tap <strong>Post</strong>.
        </p>

        <a
          href={googleUrl}
          className="w-full inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
        >
          Open Google Reviews →
        </a>
      </div>
    </PageShell>
  );

  // ── STEP: Complaint form (1–3 stars) ───────────────────────────────────────
  if (step === 'complaint') return (
    <PageShell name={campaign?.name} location={campaign?.location}>
      <div className="flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-5">
        <span className="text-2xl flex-shrink-0">🙏</span>
        <div>
          <p className="font-bold text-gray-800 text-sm">We sincerely apologise</p>
          <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
            Please tell us what went wrong. Your feedback goes directly to our management.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {compError && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
            ⚠ {compError}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            What went wrong? <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 transition-colors text-sm resize-none text-gray-800"
            rows={4}
            placeholder="Please describe your experience..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Department / Area
          </label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 transition-colors text-sm text-gray-800"
            placeholder="e.g. Emergency, Billing, Pharmacy"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Contact Number <span className="text-red-400">*</span>{' '}
            <span className="text-gray-300 font-normal">(so we can follow up)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 transition-colors text-sm text-gray-800"
            placeholder="+91 98765 43210"
            autoComplete="off"
          />
        </div>

        <button
          type="button"
          onClick={handleComplaintSubmit}
          disabled={!description.trim() || !phone.trim() || submitting}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base transition-colors"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              Submitting...
            </span>
          ) : 'Submit Feedback'}
        </button>
      </div>
    </PageShell>
  );

  // ── STEP: Done ─────────────────────────────────────────────────────────────
  if (step === 'done') return (
    <PageShell name={campaign?.name} location={campaign?.location}>
      <div className="text-center py-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Feedback Received</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Thank you. Our management team has been notified and will address your concern shortly.
          {phone && ' We will reach out to you on the number you provided.'}
        </p>
      </div>
    </PageShell>
  );
}