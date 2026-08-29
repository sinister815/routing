import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Radar, Globe2, Share2 } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Footer from "../components/layout/Footer.jsx";

const features = [
  {
    icon: Radar,
    title: "A/B split routing",
    desc: "Distribute traffic across destinations by percentage and visitor geo or device.",
  },
  {
    icon: Globe2,
    title: "Geo & device targeting",
    desc: "Route each visitor using local IP-country and user-agent detection.",
  },
  {
    icon: Share2,
    title: "S2S conversion tracking",
    desc: "Accept postback conversions, attribute them to clicks, and see revenue live.",
  },
];

const heroCards = [
  {
    icon: Radar,
    title: "Routing",
    desc: "Geo & device aware",
  },
  {
    icon: Share2,
    title: "Tracking",
    desc: "Unique click IDs per visit",
  },
  {
    icon: Globe2,
    title: "Reporting",
    desc: "Live clicks, conversions, revenue",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-page flex flex-col">
      {/* Minimal header */}
      <header className="sticky top-0 z-20 w-full bg-surface border-b border-border">
        <div className="w-full px-5 sm:px-8 lg:px-12 flex items-center justify-between h-16">
          <span className="font-display font-semibold text-lg text-ink">
            TrackFlow
          </span>

          <nav className="hidden md:flex items-center gap-8 text-sm text-muted">
            <a
              href="#features"
              className="hover:text-primary transition-colors"
            >
              Features
            </a>

            <a
              href="#about"
              className="hover:text-primary transition-colors"
            >
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-ink hover:text-primary px-3 py-2 transition-colors"
            >
              Sign in
            </Link>

            <Button
              size="sm"
              onClick={() => navigate("/register")}
              icon={ArrowRight}
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero — text led, no background image */}
      {/* <section className="w-full py-16 lg:py-20">
       */}
       <section className="w-full pt-16 pb-8 lg:pt-20 lg:pb-10">
        <div className="w-full px-5 sm:px-8 lg:px-12 text-center">
          <h1 className="font-display font-semibold text-3xl md:text-4xl lg:text-5xl text-ink max-w-4xl mx-auto leading-tight">
            Route and track affiliate traffic in real time
          </h1>

          <p className="mt-4 text-base text-muted max-w-2xl mx-auto leading-relaxed">
            Create a tracking link, split traffic between destinations, route by
            country and device, and attribute conversions with server-to-server
            postbacks — from one dashboard.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate("/register")}
              icon={ArrowRight}
            >
              Sign up free
            </Button>
          </div>

          {/* Hero capability cards */}
          <div className="mt-12 w-full grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
            {heroCards.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-5 lg:px-6 lg:py-6 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm text-muted">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="w-full py-16 lg:py-20 bg-surface border-y border-border"
      >
        <div className="w-full px-5 sm:px-8 lg:px-12">
          <h2 className="font-display font-semibold text-2xl md:text-3xl text-ink text-center">
            What it does
          </h2>

          <div className="mt-9 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {features.map((f) => {
              const Icon = f.icon;

              return (
                <div
                  key={f.title}
                  className="border border-border rounded-xl bg-page p-7 lg:p-8"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-ink">
                    {f.title}
                  </h3>

                  <p className="mt-2.5 text-sm text-muted leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="w-full py-16 lg:py-20">
        <div className="w-full px-5 sm:px-8 lg:px-12 text-center">
          <h2 className="font-display font-semibold text-2xl md:text-3xl text-ink">
            Built for fast, accurate tracking
          </h2>

          <p className="mt-5 text-base text-muted max-w-3xl mx-auto leading-relaxed">
            TrackFlow is a traffic routing and affiliate tracking engine. It
            resolves routing rules from a cache so redirects stay fast, logs
            every click asynchronously, and attributes postback conversions to
            the right click with deduplication.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full pt-2 pb-14 lg:pb-16">
        <div className="w-full px-5 sm:px-8 lg:px-12 text-center">
          <Button
            size="lg"
            onClick={() => navigate("/register")}
            icon={ArrowRight}
          >
            Start routing traffic
          </Button>
        </div>
      </section>

      <div className="w-full border-t border-border" />

      <div className="mt-auto bg-[#061225]">
        <Footer />
      </div>
    </div>
  );
}