import Link from 'next/link';

function HomePage() {
  return (
    <div className="flex flex-col gap-10 py-6">
      <section className="glass-card rounded-3xl p-8 md:p-12">
        <p className="inline-flex rounded-full chip px-3 py-1 text-xs tracking-widest">
          EARNINGS DASHBOARD
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl md:text-6xl font-bold leading-tight">
          Market events at a glance
        </h1>
        <p className="mt-4 max-w-2xl text-base md:text-lg muted-text">
          Track Fortune 500 earnings dates and estimates in one clean timeline,
          with a portfolio-style interface inspired by your personal website.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/timeline"
            className="inline-flex items-center rounded-xl px-6 py-2.5 text-sm font-semibold primary-btn transition"
          >
            View timeline
          </Link>
          <a
            href="https://finnhub.io/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-medium hover:bg-white/10 transition"
          >
            Data source
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold">Earnings coverage</h3>
          <p className="mt-2 text-sm muted-text">Full-year 2024 earnings calendar.</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold">Fast</h3>
          <p className="mt-2 text-sm muted-text">Lightweight UI with clear timelines.</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold">Actionable</h3>
          <p className="mt-2 text-sm muted-text">See estimates to prepare ahead.</p>
        </div>
      </section>

      <section className="glass-card rounded-3xl p-7 md:p-8">
        <h2 className="text-2xl font-semibold">Explore More Sections</h2>
        <p className="mt-3 muted-text">
          Use the top-right navigation to jump between Home, Stocks, News,
          Timeline, and Strategies.
        </p>
      </section>
    </div>
  );
}

export default HomePage;