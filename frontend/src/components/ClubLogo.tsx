import React from "react";

export default function ClubLogo({
  logoUrl,
  alt,
}: {
  logoUrl: string;
  alt?: string;
}) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-green-200 bg-green-50">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={alt || "Club Logo"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-xs font-black text-green-700">CLUB</span>
      )}
    </span>
  );
}
