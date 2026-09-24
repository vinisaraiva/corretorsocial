import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";

export function AppShell({
  children,
  title,
  description,
  action,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F7F8FA] lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        {(title || action) && (
          <header className="border-b border-[#E4E7EC] bg-white">
            <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
              <div>
                {title && <h1 className="text-xl font-extrabold sm:text-2xl">{title}</h1>}
                {description && (
                  <p className="mt-1 text-sm text-[#667085]">{description}</p>
                )}
              </div>
              {action}
            </div>
          </header>
        )}
        <main className="mx-auto max-w-[1280px] px-5 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
