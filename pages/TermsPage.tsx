
import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { SEO } from '../components/SEO';
import { contactDetails } from '../data/content';

export const TermsPage = () => {
  return (
    <div className="bg-white">
      <SEO title="Terms & Conditions" description="Website usage terms and conditions for Fresh Tech." />
      <PageHeader title="Terms & Conditions" subtitle="The legal bit." />
      
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="prose prose-lg text-gray-600">
          <h3>1. Introduction</h3>
          <p>
            Welcome to {contactDetails.legal?.tradingAs || "Fresh Tech"}. These terms and conditions outline the rules and regulations for the use of our website.
            By accessing this website we assume you accept these terms and conditions. Do not continue to use Fresh Tech if you do not agree to take all of the terms and conditions stated on this page.
          </p>

          <h3>2. Intellectual Property Rights</h3>
          <p>
            Other than the content you own, under these Terms, {contactDetails.legal?.name} and/or its licensors own all the intellectual property rights and materials contained in this Website.
            You are granted limited license only for purposes of viewing the material contained on this Website.
          </p>

          <h3>3. Restrictions</h3>
          <p>You are specifically restricted from all of the following:</p>
          <ul>
            <li>Publishing any Website material in any other media;</li>
            <li>Selling, sublicensing and/or otherwise commercializing any Website material;</li>
            <li>Publicly performing and/or showing any Website material;</li>
            <li>Using this Website in any way that is or may be damaging to this Website;</li>
            <li>Using this Website in any way that impacts user access to this Website;</li>
          </ul>

          <h3>4. Managed Services Agreement</h3>
          <p>
            These terms relate specifically to the use of this website. Clients engaging Fresh Tech for IT support services will be provided with a separate Managed Services Agreement (MSA) or Terms of Business outlining service level agreements (SLAs), payment terms, and liability.
          </p>

          <h3>5. Limitation of Liability</h3>
          <p>
            In no event shall {contactDetails.legal?.name}, nor any of its officers, directors and employees, be held liable for anything arising out of or in any way connected with your use of this Website.
          </p>

          <h3>6. Governing Law & Jurisdiction</h3>
          <p>
            These Terms will be governed by and interpreted in accordance with the laws of the United Kingdom, and you submit to the non-exclusive jurisdiction of the state and federal courts located in the UK for the resolution of any disputes.
          </p>
        </div>
      </div>
    </div>
  );
};
