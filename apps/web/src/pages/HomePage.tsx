import { Link } from 'react-router-dom';
import { Shield, Zap, Globe, ChevronRight } from 'lucide-react';
import { ROUTES } from '../lib/routes';
import Button from '../components/ui/Button';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-24">

      {/* Hero */}
      <section className="text-center pt-16 pb-8">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-verse-magenta/10 border
                        border-verse-magenta/30 rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-verse-magenta animate-pulse" />
          <span className="text-xs text-verse-magenta font-medium tracking-wide">
            Built for African creators
          </span>
        </div>

        <h1 className="font-display text-5xl font-bold text-white leading-tight mb-4 max-w-3xl mx-auto">
          Prove you made it.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-verse-magenta to-verse-magenta-deep">
            Before anyone steals it.
          </span>
        </h1>

        <p className="text-verse-slate text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          Upload your beat. Get a timestamped ownership certificate in 60 seconds.
          Nobody can claim your work — not even AI.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link to={ROUTES.REGISTER}>
            <Button size="lg">
              Protect Your Music Free
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link to={ROUTES.LOGIN}>
            <Button variant="ghost" size="lg">
              Sign In
            </Button>
          </Link>
        </div>

        <p className="text-verse-muted text-sm mt-4">
          From ₦0 · No credit card required · Certificate in 60 seconds
        </p>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-verse-elevated py-6">
        <p className="text-center text-xs text-verse-muted uppercase tracking-widest mb-4">
          Trusted IP infrastructure
        </p>
        <div className="flex items-center justify-center gap-12 flex-wrap">
          {['RFC 3161 Timestamping', 'ACRCloud Detection', 'SHA-256 Fingerprint', 'NCC-Compatible'].map((item) => (
            <span key={item} className="text-sm text-verse-slate font-medium">
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="font-display text-3xl font-bold text-white text-center mb-12">
          How it works
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Upload your work',
              desc: 'Drag and drop your beat, track, or audio file. We accept MP3, WAV, FLAC, and more.',
            },
            {
              step: '02',
              title: 'We timestamp it',
              desc: 'Your file is hashed and timestamped using RFC 3161 — the international standard for proof of existence.',
            },
            {
              step: '03',
              title: 'Get your certificate',
              desc: 'Download a branded PDF certificate with your ISRC, timestamp, and a shareable verification link.',
            },
          ].map((item) => (
            <div key={item.step} className="bg-verse-charcoal border border-verse-elevated rounded-xl p-6">
              <p className="font-display text-4xl font-bold text-verse-magenta/30 mb-3">
                {item.step}
              </p>
              <h3 className="font-display text-lg font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-verse-muted text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="font-display text-3xl font-bold text-white text-center mb-12">
          Everything you need to protect your IP
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              icon: <Shield className="w-6 h-6 text-verse-magenta" />,
              title: 'Timestamped Proof',
              desc: 'RFC 3161 international timestamp — legally recognised and NCC-compatible.',
            },
            {
              icon: <Zap className="w-6 h-6 text-verse-teal" />,
              title: 'Audio Fingerprinting',
              desc: 'Your track is registered with ACRCloud so we can detect unauthorised use across platforms.',
            },
            {
              icon: <Globe className="w-6 h-6 text-verse-orange" />,
              title: 'AI Scraping Defense',
              desc: 'Your certificate is proof when AI uses your sound without permission.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-verse-charcoal border border-verse-elevated rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-verse-elevated flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-display text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-verse-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pidgin CTA */}
      <section className="bg-verse-charcoal border border-verse-elevated rounded-2xl p-12 text-center">
        <p className="font-display text-2xl font-bold text-verse-muted mb-2 italic">
          "HD verse don help me protect my music and make money from am,
          nobody fit steal am, not even AI artists."
        </p>
        <p className="text-verse-muted text-sm mb-8">— Nigerian music producer</p>
        <Link to={ROUTES.REGISTER}>
          <Button size="lg">
            Start Protecting Your Music
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-verse-elevated py-8 text-center">
        <p className="text-verse-muted text-sm">
          © 2026 HD Verse · Africa's Creative IP Infrastructure ·{' '}
          <a href="mailto:hello@myhdverse.com" className="text-verse-magenta hover:underline">
            hello@myhdverse.com
          </a>
        </p>
      </footer>

    </div>
  );
}
