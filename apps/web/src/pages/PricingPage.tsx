import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../lib/routes';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Check, Sparkles, X, Mail } from 'lucide-react';

export default function PricingPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalTier, setModalTier] = useState('');
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  const openWaitlist = (tier: string) => {
    setModalTier(tier);
    setShowModal(true);
    setJoined(false);
    setEmail('');
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Save to localStorage waitlist array
    const key = 'hdv_waitlist';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    current.push({ email, tier: modalTier, date: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(current));
    
    setJoined(true);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 font-body relative overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-verse-magenta/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <h1 className="font-display text-[40px] font-bold text-white tracking-tight leading-tight">
          Simple, honest pricing
        </h1>
        <p className="text-verse-slate text-base">
          Start with one track. Protect your copyrights, assign ISRCs, and track unauthorized distribution instantly.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-12 items-stretch">
        
        {/* Plan 1: PAY PER CERTIFICATE */}
        <div className="bg-verse-charcoal rounded-[20px] border border-verse-magenta p-8 flex flex-col justify-between shadow-lg relative transform hover:-translate-y-1 transition-all duration-200">
          {/* Highlight Badge */}
          <div className="absolute -top-3.5 right-6 bg-verse-magenta text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3 h-3" />
            Recommended
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold text-verse-muted uppercase tracking-wider block">
                Single Release
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">Pay-Per-Certificate</h3>
              <div className="mt-4 flex items-baseline gap-1.5 text-white">
                <span className="text-3xl font-bold tracking-tight">₦3,000</span>
                <span className="text-xs text-verse-muted">/ single work</span>
              </div>
            </div>

            <p className="text-xs text-verse-slate leading-relaxed">
              Perfect for independent creators dropping singles who want immediate, permanent copyright certification.
            </p>

            <ul className="space-y-3 pt-2 text-xs text-verse-slate">
              <FeatureItem>Ownership certificate (RFC 3161)</FeatureItem>
              <FeatureItem>Automatic ISRC assignment</FeatureItem>
              <FeatureItem>ACRCloud fingerprint & registry</FeatureItem>
              <FeatureItem>NCC-compatible ownership proof</FeatureItem>
              <FeatureItem>Shareable public verification link</FeatureItem>
            </ul>
          </div>

          <div className="pt-8">
            <Button 
              variant="primary" 
              className="w-full flex items-center gap-1.5 justify-center"
              onClick={() => navigate(ROUTES.UPLOAD)}
            >
              Protect a Work →
            </Button>
          </div>
        </div>

        {/* Plan 2: BASIC SUBSCRIPTION */}
        <div className="bg-verse-charcoal rounded-[20px] border border-white/5 p-8 flex flex-col justify-between shadow-md relative transform hover:-translate-y-1 transition-all duration-200">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-verse-muted uppercase tracking-wider">
                Monthly Plan
              </span>
              <span className="bg-verse-orange/10 border border-verse-orange/20 text-verse-orange text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Coming Soon
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mt-1">Basic Sub</h3>
              <div className="mt-4 flex items-baseline gap-1.5 text-white">
                <span className="text-3xl font-bold tracking-tight">₦19,000</span>
                <span className="text-xs text-verse-muted">/ month</span>
              </div>
            </div>

            <p className="text-xs text-verse-slate leading-relaxed">
              Designed for productive producers and artists releasing tracks consistently.
            </p>

            <ul className="space-y-3 pt-2 text-xs text-verse-slate">
              <FeatureItem>Up to 12 certified works/month</FeatureItem>
              <FeatureItem>Full metadata registry</FeatureItem>
              <FeatureItem>Email alerts (2x monthly scan)</FeatureItem>
              <FeatureItem>Permanent verification hosted URL</FeatureItem>
            </ul>
          </div>

          <div className="pt-8">
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => openWaitlist('Basic Subscription')}
            >
              Join Waitlist
            </Button>
          </div>
        </div>

        {/* Plan 3: PRO SUBSCRIPTION */}
        <div className="bg-verse-charcoal rounded-[20px] border border-white/5 p-8 flex flex-col justify-between shadow-md relative transform hover:-translate-y-1 transition-all duration-200">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-verse-muted uppercase tracking-wider">
                Professional
              </span>
              <span className="bg-verse-orange/10 border border-verse-orange/20 text-verse-orange text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Coming Soon
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mt-1">Pro Sub</h3>
              <div className="mt-4 flex items-baseline gap-1.5 text-white">
                <span className="text-3xl font-bold tracking-tight">₦50,000</span>
                <span className="text-xs text-verse-muted">/ month</span>
              </div>
            </div>

            <p className="text-xs text-verse-slate leading-relaxed">
              Best for labels, publishers, and top creatives managing extensive catalogs.
            </p>

            <ul className="space-y-3 pt-2 text-xs text-verse-slate">
              <FeatureItem>Unlimited certified works</FeatureItem>
              <FeatureItem>Weekly unauthorized use scan reports</FeatureItem>
              <FeatureItem>ACRCloud instant active detection</FeatureItem>
              <FeatureItem>Automated copyright enforcement portal</FeatureItem>
              <FeatureItem>Priority developer support</FeatureItem>
            </ul>
          </div>

          <div className="pt-8">
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => openWaitlist('Pro Subscription')}
            >
              Join Waitlist
            </Button>
          </div>
        </div>

      </div>

      {/* Footer hint text */}
      <div className="text-center py-4">
        <p className="text-xs text-verse-muted">
          Not sure? Start with one track for <strong className="text-white">₦3,000</strong>. No subscription needed.
        </p>
      </div>

      {/* Waitlist Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-verse-charcoal border border-white/5 rounded-[20px] w-full max-w-[400px] overflow-hidden shadow-2xl relative">
            <button 
              className="absolute top-4 right-4 text-verse-slate hover:text-white transition-colors"
              onClick={() => setShowModal(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8 space-y-6">
              <div className="text-center space-y-2">
                <Mail className="w-10 h-10 text-verse-magenta mx-auto mb-2" />
                <h3 className="font-display text-xl font-bold text-white">Join the Waitlist</h3>
                <p className="text-xs text-verse-muted">
                  Get notified the moment we launch the <strong className="text-white">{modalTier}</strong>.
                </p>
              </div>

              {joined ? (
                <div className="text-center py-4 bg-verse-teal/5 border border-verse-teal/10 rounded-md">
                  <Check className="w-8 h-8 text-verse-teal mx-auto mb-2" />
                  <p className="text-xs font-medium text-verse-teal">You've successfully joined the waitlist!</p>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <Input 
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button variant="primary" type="submit" className="w-full">
                    Notify Me
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="w-3.5 h-3.5 text-verse-teal flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}
