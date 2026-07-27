import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const iconMark = readFileSync(join(process.cwd(), "public/brand/logo.png")).toString("base64");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${iconMark}`}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          alt=""
        />
      </div>
    ),
    { ...size }
  );
}
