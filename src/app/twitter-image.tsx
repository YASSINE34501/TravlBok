import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const alt = "TravlBok — Explore, Book, Travel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const logo = readFileSync(join(process.cwd(), "public/brand/logo.png")).toString("base64");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${logo}`}
          style={{ width: "70%", height: "70%", objectFit: "contain" }}
          alt=""
        />
      </div>
    ),
    { ...size }
  );
}
