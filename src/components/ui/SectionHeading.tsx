interface SectionHeadingProps {
  label?: string;
  heading: string;
  subtext?: string;
  align?: "left" | "center";
  light?: boolean; // for use on dark backgrounds
}

export default function SectionHeading({
  label,
  heading,
  subtext,
  align = "center",
  light = false,
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";
  const headingColor = light ? "text-white" : "text-chocolate";
  const subtextColor = light ? "text-white/80" : "text-chocolate/70";

  return (
    <div className={`flex flex-col gap-2 ${alignClass}`}>
      {label && (
        <div className="flex items-center gap-2">
          <span className="h-px w-8 bg-peach" />
          <span className="text-xs font-bold uppercase tracking-widest text-peach">
            {label}
          </span>
          <span className="h-px w-8 bg-peach" />
        </div>
      )}
      <h2 className={`text-3xl md:text-4xl font-extrabold leading-tight ${headingColor}`}>
        {heading}
      </h2>
      {subtext && (
        <p className={`text-base md:text-lg max-w-xl ${subtextColor}`}>{subtext}</p>
      )}
    </div>
  );
}
