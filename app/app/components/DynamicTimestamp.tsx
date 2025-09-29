"use client"

import { useState, useEffect } from 'react';

interface DynamicTimestampProps {
  uploadDate: string;
}

export function DynamicTimestamp({ uploadDate }: DynamicTimestampProps) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const uploaded = new Date(uploadDate);
      const diffInSeconds = Math.floor((now.getTime() - uploaded.getTime()) / 1000);

      if (diffInSeconds < 60) {
        setTimeAgo(`${diffInSeconds} sec ago`);
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setTimeAgo(`${minutes} min ago`);
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        setTimeAgo(`${hours} hour${hours > 1 ? 's' : ''} ago`);
      } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        setTimeAgo(`${days} day${days > 1 ? 's' : ''} ago`);
      } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        setTimeAgo(`${months} month${months > 1 ? 's' : ''} ago`);
      } else {
        const years = Math.floor(diffInSeconds / 31536000);
        setTimeAgo(`${years} year${years > 1 ? 's' : ''} ago`);
      }
    };

    // Update immediately
    updateTimeAgo();

    // Update every minute
    const interval = setInterval(updateTimeAgo, 60000);

    return () => clearInterval(interval);
  }, [uploadDate]);

  return <span>{timeAgo}</span>;
}
