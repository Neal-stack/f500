import Link from 'next/link';

function HomePage() {
  return (
    <div className="flex flex-col items-start gap-8 py-8">
      <section className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">Market events at a glance</h1>
        <p className="mt-4 text-neutral-300">
          Browse upcoming and past earnings for major companies. Stay on top of
          key dates and estimates in one simple timeline.
        </p>
        <div className="mt-6 flex items-center gap-4">
          <Link
            href="/timeline"
            className="inline-flex items-center rounded-md bg-white px-4 py-2 text-black font-medium hover:bg-neutral-200 transition"
          >
            View timeline
          </Link>
          <a
            href="https://finnhub.io/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border border-neutral-700 px-4 py-2 font-medium hover:bg-neutral-900 transition"
          >
            Data source
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <div className="rounded-lg border border-neutral-800 p-4">
          <h3 className="font-semibold">Earnings coverage</h3>
          <p className="mt-2 text-sm text-neutral-400">Full-year 2024 earnings calendar.</p>
        </div>
        <div className="rounded-lg border border-neutral-800 p-4">
          <h3 className="font-semibold">Fast</h3>
          <p className="mt-2 text-sm text-neutral-400">Lightweight UI with clear timelines.</p>
        </div>
        <div className="rounded-lg border border-neutral-800 p-4">
          <h3 className="font-semibold">Actionable</h3>
          <p className="mt-2 text-sm text-neutral-400">See estimates to prepare ahead.</p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;