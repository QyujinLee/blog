export function Footer() {
  return (
    <footer
      className="mt-auto flex flex-col items-center gap-1 px-4 py-6 text-center text-sm"
      style={{ background: "var(--serenity-600)", color: "var(--serenity-50)" }}
    >
      <p>Copyright © {new Date().getFullYear()} gyujin. All rights reserved.</p>
      <a href="mailto:gyujin89@gmail.com" className="hover:underline">
        gyujin89@gmail.com
      </a>
    </footer>
  );
}
