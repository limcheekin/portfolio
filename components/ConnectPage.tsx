
import React, { useState } from 'react';
import { SectionWrapper, Button } from './Layout';
import { CONTACT_CONTENT, EMAIL_ADDRESS } from '../constants';
import { SectionProps } from '../types';

export const ContactSection: React.FC<SectionProps> = ({ id }) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio Contact from ${formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
    );
    window.location.href = `mailto:${EMAIL_ADDRESS}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <SectionWrapper
      id={id}
      title={CONTACT_CONTENT.subtext}
      titleNumber="04"
      className="text-center max-w-xl mx-auto"
      contentClassName="flex flex-col items-center"
    >
      <h3 className="text-3xl md:text-4xl font-semibold text-lightest-slate mb-4 -mt-4">
        {CONTACT_CONTENT.title}
      </h3>
      <div className="prose prose-slate dark:prose-invert max-w-lg mx-auto text-center mb-10">
        <p>{CONTACT_CONTENT.paragraph}</p>
      </div>

      {submitted ? (
        <div data-testid="contact-form-success" className="text-green-accent font-mono text-sm mb-8">
          Your email client should have opened. Thanks for reaching out!
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          data-testid="contact-form"
          className="w-full max-w-lg text-left mb-8 space-y-5"
        >
          <div>
            <label htmlFor="contact-name" className="block font-mono text-xs text-light-slate mb-1.5">
              Name
            </label>
            <input
              type="text"
              id="contact-name"
              name="name"
              required
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              data-testid="contact-field-name"
              className="w-full bg-light-navy border border-lightest-navy rounded px-4 py-3 text-sm text-lightest-slate placeholder-slate-text/50 focus:border-green-accent focus:outline-none transition-colors duration-250"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="block font-mono text-xs text-light-slate mb-1.5">
              Email
            </label>
            <input
              type="email"
              id="contact-email"
              name="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              data-testid="contact-field-email"
              className="w-full bg-light-navy border border-lightest-navy rounded px-4 py-3 text-sm text-lightest-slate placeholder-slate-text/50 focus:border-green-accent focus:outline-none transition-colors duration-250"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label htmlFor="contact-message" className="block font-mono text-xs text-light-slate mb-1.5">
              Message
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={5}
              value={formData.message}
              onChange={handleChange}
              data-testid="contact-field-message"
              className="w-full bg-light-navy border border-lightest-navy rounded px-4 py-3 text-sm text-lightest-slate placeholder-slate-text/50 focus:border-green-accent focus:outline-none transition-colors duration-250 resize-y"
              placeholder="What would you like to discuss?"
            />
          </div>
          <div className="text-center pt-2">
            <Button type="submit" data-testid="contact-form-submit" size="lg">
              Send Message
            </Button>
          </div>
        </form>
      )}

      <p className="font-mono text-xs text-slate-text mb-4">or email directly</p>
      <Button
        href={`mailto:${EMAIL_ADDRESS}`}
        size="md"
        data-testid="contact-cta"
        variant="secondary"
      >
        {CONTACT_CONTENT.buttonText}
      </Button>
    </SectionWrapper>
  );
};
