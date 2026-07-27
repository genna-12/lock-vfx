import React, { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Send, Mail, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { GlassCard } from '../glass/GlassCard';
import { GlassButton } from '../glass/GlassButton';

export const ContactSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isIt = i18n.language === 'it';

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');

    const formData = new FormData(e.currentTarget);
    // Web3Forms Key (sostituire con la propria API Key gratuita ottenuta su web3forms.com in 10 secondi)
    formData.append('access_key', 'YOUR_WEB3FORMS_ACCESS_KEY');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="py-24 px-6 relative max-w-6xl mx-auto">
      {/* Background Glow */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#E60B18]/15 rounded-full blur-[160px] pointer-events-none transform-gpu" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Info & Details */}
        <div className="lg:col-span-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#E60B18] mb-2">
            {isIt ? 'Inizia un Progetto' : 'Start a Project'}
          </h2>
          <h3 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-6">
            {isIt ? 'Parliamo della tua visione.' : 'Let\'s create something legendary.'}
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            {isIt
              ? 'Hai un film, uno spot o una sequenza ad alto contenuto di VFX in cantiere? Scrivici per ricevere una valutazione di pipeline e preventivo.'
              : 'Have a feature film, commercial, or VFX sequence in development? Drop us a line for a breakdown and pipeline assessment.'}
          </p>

          <div className="space-y-4">
            <GlassCard variant="low" className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#E60B18]/20 border border-[#E60B18]/40 flex items-center justify-center text-[#E60B18]">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Email Direct</div>
                <a href="mailto:info@lockvfx.com" className="text-sm font-semibold text-white hover:text-[#E60B18] transition-colors">
                  info@lockvfx.com
                </a>
              </div>
            </GlassCard>

            <GlassCard variant="low" className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Studio Location</div>
                <div className="text-sm font-semibold text-white">Milan, Italy & Remote Worldwide</div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Right Column: Glassmorphic Form */}
        <div className="lg:col-span-7">
          <GlassCard variant="high" className="p-8 sm:p-10 relative">
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <CheckCircle2 className="w-16 h-16 text-[#E60B18] mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-white mb-2">
                  {isIt ? 'Messaggio Inviato!' : 'Message Sent!'}
                </h4>
                <p className="text-zinc-400 text-sm max-w-md mx-auto">
                  {isIt
                    ? 'Grazie per averci contattato. Il team di Lock VFX ti risponderà entro 24 ore lavorative.'
                    : 'Thank you for reaching out. The Lock VFX production team will review your enquiry within 24 business hours.'}
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2">
                      {isIt ? 'Nome e Cognome' : 'Your Name'} *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-white/3 border border-white/12 text-white text-sm focus:outline-none focus:border-[#E60B18] focus:ring-1 focus:ring-[#E60B18] transition-all"
                    />
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2">
                      {isIt ? 'Email Aziendale' : 'Business Email'} *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="john@studio.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/3 border border-white/12 text-white text-sm focus:outline-none focus:border-[#E60B18] focus:ring-1 focus:ring-[#E60B18] transition-all"
                    />
                  </div>
                </div>

                {/* Project Category Select */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2">
                    {isIt ? 'Tipologia di Progetto' : 'Project Category'}
                  </label>
                  <select
                    name="category"
                    className="w-full px-4 py-3 rounded-xl bg-white/3 border border-white/12 text-white text-sm focus:outline-none focus:border-[#E60B18] transition-all"
                  >
                    <option value="Feature Film">{isIt ? 'Lungometraggio / Cinema' : 'Feature Film'}</option>
                    <option value="Commercial">{isIt ? 'Spot Pubblicitario' : 'Commercial Campaign'}</option>
                    <option value="Music Video">{isIt ? 'Videoclip Musicale' : 'Music Video'}</option>
                    <option value="3D Asset / CGI">{isIt ? 'Asset 3D & CGI In-Game' : '3D Asset & CGI'}</option>
                  </select>
                </div>

                {/* Message Input */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2">
                    {isIt ? 'Dettagli del Progetto / Shot Count' : 'Project Scope & Details'} *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    placeholder={isIt ? 'Descrivi brevemente gli shot VFX o il lavoro richiesto...' : 'Briefly describe your required VFX shots or timeline...'}
                    className="w-full px-4 py-3 rounded-xl bg-white/3 border border-white/12 text-white text-sm focus:outline-none focus:border-[#E60B18] focus:ring-1 focus:ring-[#E60B18] transition-all resize-none"
                  />
                </div>

                {status === 'error' && (
                  <div className="flex items-center gap-2 text-red-500 text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>{isIt ? 'Si è verificato un errore. Riprova o invia un\'email diretta.' : 'An error occurred. Please try again or email directly.'}</span>
                  </div>
                )}

                {/* Submit Button */}
                <GlassButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center"
                  disabled={status === 'submitting'}
                >
                  <Send className="w-4 h-4" />
                  <span>{status === 'submitting' ? (isIt ? 'Invio in corso...' : 'Sending...') : (isIt ? 'Invia Richiesta' : 'Send Request')}</span>
                </GlassButton>
              </form>
            )}
          </GlassCard>
        </div>
      </div>
    </section>
  );
};