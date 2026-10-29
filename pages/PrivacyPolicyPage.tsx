
import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { SEO } from '../components/SEO';
import { contactDetails } from '../data/content';

export const PrivacyPolicyPage = () => {
  return (
    <div className="bg-white">
      <SEO title="Privacy Policy" description="How Fresh Tech protects your data. GDPR and data protection information." />
      <PageHeader title="Privacy Policy" subtitle="Your data, protected." />
      
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="prose prose-lg text-gray-600">
          <p><strong>Last Updated: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</strong></p>
          
          <h3>1. Who We Are</h3>
          <p>
            We are {contactDetails.legal?.name || "Fresh PCs Consultancy Ltd"} trading as Fresh Tech ("we", "us", "our"). 
            Our company registration number is {contactDetails.legal?.companyNumber || "09296207"}. 
            Our registered address is {contactDetails.address.line1}, {contactDetails.address.line2}, {contactDetails.address.postcode}.
          </p>

          <h3>2. Data We Collect</h3>
          <p>We may collect the following information:</p>
          <ul>
            <li>Name and job title.</li>
            <li>Contact information including email address and telephone number.</li>
            <li>Demographic information such as postcode, preferences, and interests.</li>
            <li>Technical data including IP addresses and browser type when you visit our website.</li>
          </ul>

          <h3>3. How We Use Your Data</h3>
          <p>We require this information to understand your needs and provide you with a better service, specifically for:</p>
          <ul>
            <li>Internal record keeping.</li>
            <li>Improving our products and services.</li>
            <li>Sending promotional emails about new services or special offers (you can opt-out at any time).</li>
            <li>Responding to your enquiries submitted via our contact forms.</li>
          </ul>

          <h3>4. Security</h3>
          <p>
            We are committed to ensuring that your information is secure. In order to prevent unauthorised access or disclosure, 
            we have put in place suitable physical, electronic, and managerial procedures to safeguard and secure the information we collect online.
            As an IT security company, we practice what we preach.
          </p>

          <h3>5. Cookies</h3>
          <p>
            A cookie is a small file which asks permission to be placed on your computer's hard drive. We use traffic log cookies to identify which pages are being used. 
            This helps us analyse data about webpage traffic and improve our website in order to tailor it to customer needs. 
            We only use this information for statistical analysis purposes.
          </p>

          <h3>6. Controlling Your Personal Information</h3>
          <p>
            You may choose to restrict the collection or use of your personal information. If you have previously agreed to us using your personal information for direct marketing purposes, 
            you may change your mind at any time by writing to or emailing us at <a href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a>.
          </p>
          <p>
            We will not sell, distribute, or lease your personal information to third parties unless we have your permission or are required by law to do so.
          </p>
        </div>
      </div>
    </div>
  );
};
