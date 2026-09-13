"use client";
import { useState } from "react";
import { Play, Pause } from "lucide-react";
import { useTranslations } from "next-intl";

export function ExerciseMedia({
  image,
  gif,
  name,
  large = false,
}: {
  image: string;
  gif: string;
  name: string;
  large?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [hovering, setHovering] = useState(false);
  const t = useTranslations("UI");
  const active = playing || hovering;
  return (
    <button
      type="button"
      aria-label={active ? t("pause") : t("play")}
      aria-pressed={active}
      className={`relative flex cursor-pointer w-full items-center justify-center overflow-hidden rounded-lg bg-white ${large ? "min-h-80 py-10 sm:min-h-[480px]" : "h-48 py-3"}`}
      onMouseEnter={() => {
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setHovering(true);
      }}
      onMouseLeave={() => setHovering(false)}
      onClick={() => {
        // A click pins a hover preview; another click pauses. The entire media area
        // sits above the card trigger, so mouse, touch and keyboard never navigate.
        setPlaying((value) => !value);
        setHovering(false);
      }}
    >
      <img
        src={active ? gif : image}
        alt={name}
        width={180}
        height={180}
        loading={large ? "eager" : "lazy"}
        className={large ? "size-72 max-w-full object-contain" : "size-44 object-contain"}
      />
      <span
        aria-hidden="true"
        className="absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm"
      >
        {active ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </span>
    </button>
  );
}
