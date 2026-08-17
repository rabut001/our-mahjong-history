export function MockShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-surface text-ink">
      {children}
    </div>
  );
}
