import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface BusinessHoursProps {
  className?: string;
}

/**
 * Business Hours Indicator
 * Shows whether the office is currently open or closed
 * Updates every minute to stay accurate
 */
export const BusinessHours: React.FC<BusinessHoursProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  const checkBusinessHours = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes; // Minutes since midnight

    const openTime = 9 * 60; // 9:00 AM
    const closeTime = 17 * 60; // 5:00 PM

    // Weekends
    if (day === 0 || day === 6) {
      return { isOpen: false, message: 'Back Monday 9am' };
    }

    // Before opening
    if (currentTime < openTime) {
      const minsUntilOpen = openTime - currentTime;
      if (minsUntilOpen <= 60) {
        return { isOpen: false, message: `Opens in ${minsUntilOpen} mins` };
      }
      return { isOpen: false, message: 'Opens at 9am' };
    }

    // After closing
    if (currentTime >= closeTime) {
      // Check if tomorrow is weekend
      if (day === 5) {
        return { isOpen: false, message: 'Back Monday 9am' };
      }
      return { isOpen: false, message: 'Back at 9am' };
    }

    // During business hours
    const minsUntilClose = closeTime - currentTime;
    if (minsUntilClose <= 30) {
      return { isOpen: true, message: `Closing in ${minsUntilClose} mins` };
    }

    return { isOpen: true, message: "We're open!" };
  };

  useEffect(() => {
    // Initial check
    setStatus(checkBusinessHours());

    // Update every minute
    const interval = setInterval(() => {
      setStatus(checkBusinessHours());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}
      title="Business hours: Mon-Fri 9am-5pm"
    >
      <span className={`w-2 h-2 rounded-full ${status.isOpen ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
      <Clock size={12} className={status.isOpen ? 'text-green-400' : 'text-gray-400'} />
      <span className={status.isOpen ? 'text-green-300' : 'text-gray-400'}>{status.message}</span>
    </span>
  );
};
