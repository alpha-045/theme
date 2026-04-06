import { useState } from "react";
import {Link } from "react-router-dom"


export default function Landingpage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-28 md:py-40">
        <h1 className="text-4xl md:text-6xl font-extrabold text-[#1B2D4F] leading-tight max-w-2xl">
          Connect with{" "}
          <span className="block">Skilled Professionals</span>
        </h1>
        <p className="mt-6 text-gray-500 text-base md:text-lg max-w-xl leading-relaxed">
          ServiceCoop is a cooperative platform connecting clients with trusted operatives.
          Find the perfect service provider or offer your skills to the community.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/login"
            className="flex items-center gap-2 bg-[#1b2d4f57] text-white text-sm font-semibold px-7 py-3.5 rounded-lg hover:bg-[#243d6a] transition-colors"
          >
            Browse Services
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            to="/login"
            className="text-[#1B2D4F] text-sm font-semibold px-7 py-3.5 rounded-lg border border-[#1B2D4F] hover:bg-[#1B2D4F] hover:text-white transition-colors"
          >
            Join as Operative
          </Link>
        </div>
      </section>
    </div>
  );
}