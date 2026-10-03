export default function Flash({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p role="status" className="mb-6 border-l-4 border-[#9b5b2b] bg-[#f3eee7] px-4 py-3 text-sm text-black/75">{msg}</p>;
}
