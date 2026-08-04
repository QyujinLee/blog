import localFont from "next/font/local";

export const pretendard = localFont({
  src: [
    { path: "../assets/fonts/Pretendard-Regular.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/Pretendard-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../assets/fonts/Pretendard-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

export const jetbrainsMono = localFont({
  src: "../assets/fonts/JetBrainsMono-Regular.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-jetbrains-mono",
  display: "swap",
});
