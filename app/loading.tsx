export default function Loading() {
  return (
    <main
      className="min-h-screen bg-[#F7F8FA] px-5 py-8 sm:px-8"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto max-w-[1280px] animate-pulse">
        <div className="h-8 w-56 rounded-lg bg-[#EAECF0]" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-[#EAECF0]" />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="h-52 rounded-[14px] bg-white ring-1 ring-[#E4E7EC] lg:col-span-2" />
          <div className="h-52 rounded-[14px] bg-white ring-1 ring-[#E4E7EC]" />
        </div>
      </div>
    </main>
  );
}
