import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-[#023047] py-4 px-4 lg:px-6 text-sm">
      <div className="flex text-white flex-col sm:flex-row items-center justify-between gap-2">
        <span>TrackFlow — Traffic Routing & Affiliate Tracking</span>

        <span>
          © {new Date().getFullYear()} All rights reserved.
        </span>
      </div>
    </footer>
  );
}