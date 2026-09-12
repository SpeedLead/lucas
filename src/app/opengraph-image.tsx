import { siteConfig } from "@/lib/site-config";
import { ImageResponse } from "next/og";

export const alt = `${siteConfig.name} — table tennis, markets, and AI`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#121212",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* net */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 2,
            background: "#1f8a5f",
            opacity: 0.35,
          }}
        />
        {/* ball */}
        <div
          style={{
            position: "absolute",
            right: 150,
            top: 130,
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: "#ff6a13",
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontFamily: "monospace",
            color: "#ff6a13",
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          Middle schooler
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 140,
            fontWeight: 700,
            color: "#f3ede1",
            lineHeight: 1,
            marginTop: 16,
          }}
        >
          HEY, I&apos;M {siteConfig.name.toUpperCase()}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: "#a29d90",
            marginTop: 28,
          }}
        >
          table tennis 🏓 · markets 📈 · AI 🤖
        </div>
      </div>
    ),
    size,
  );
}
