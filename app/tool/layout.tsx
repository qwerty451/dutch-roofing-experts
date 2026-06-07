export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-black min-h-screen text-white">{children}</div>;
}
