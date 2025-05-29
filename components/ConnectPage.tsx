
import React from 'react';
import { SectionWrapper, Button } from './Layout';
import { CONTACT_CONTENT, EMAIL_ADDRESS } from '../constants';
import { SectionProps } from '../types';

export const ContactSection: React.FC<SectionProps> = ({ id }) => {
  return (
    <SectionWrapper 
        id={id} 
        title={CONTACT_CONTENT.subtext} // "Get In Touch"
        titleNumber="04" // Example numbering
        className="text-center max-w-xl mx-auto" // Constrain width and center content
        contentClassName="flex flex-col items-center"
    >
      <h3 className="text-3xl md:text-4xl font-semibold text-lightest-slate mb-4 -mt-4"> {/* Main hook like "What's Next?" */}
        {CONTACT_CONTENT.title}
      </h3>
      <div className="prose prose-slate dark:prose-invert max-w-lg mx-auto text-center mb-10">
        <p>{CONTACT_CONTENT.paragraph}</p>
      </div>
      <Button 
        href={`mailto:${EMAIL_ADDRESS}`} 
        size="lg" // Brittany Chiang style large button
      >
        {CONTACT_CONTENT.buttonText}
      </Button>
    </SectionWrapper>
  );
};

// TestimonialsSection removed to align with Brittany Chiang's portfolio style, which doesn't feature a prominent testimonial section.
// Testimonials can be powerful but are omitted here for design consistency with the reference.
