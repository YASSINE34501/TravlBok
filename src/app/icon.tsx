import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const iconMark = readFileSync(join(process.cwd(), "public/brand/icon-mark.png")).toString("base64");

  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`data:image/png;base64,${iconMark}`}
        width={size.width}
        height={size.height}
        alt=""
      />
    ),
    { ...size }
  );
}
