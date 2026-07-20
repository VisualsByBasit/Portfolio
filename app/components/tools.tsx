"use client";

/**
 * Shared tool/logo data for the tech-stack card and the skills marquee.
 * Most logos come from the simple-icons CDN (brand-colored SVGs).
 * Tools without a simple-icons entry (Adobe Illustrator, VS Code) render
 * as styled monogram badges instead so nothing 404s.
 */
export type Tool = {
  name: string;
  slug?: string; // simple-icons slug
  monogram?: string; // fallback badge text
  monogramColor?: string;
};

export const TOOLS: Tool[] = [
  { name: "Figma", slug: "figma" },
  { name: "Canva", slug: "canva" },
  { name: "Next.js", slug: "nextdotjs" },
  { name: "React", slug: "react" },
  { name: "TypeScript", slug: "typescript" },
  { name: "JavaScript", slug: "javascript" },
  { name: "Illustrator", monogram: "Ai", monogramColor: "#ff9a00" },
  { name: "Hostinger", slug: "hostinger" },
  { name: "HTML5", slug: "html5" },
  { name: "CSS", slug: "css" },
  { name: "Node.js", slug: "nodedotjs" },
  { name: "Git", slug: "git" },
  { name: "GitHub", slug: "github" },
  { name: "Vercel", slug: "vercel" },
  { name: "Framer", slug: "framer" },
  { name: "Three.js", slug: "threedotjs" },
  { name: "GSAP", slug: "gsap" },
  { name: "VS Code", monogram: "</>", monogramColor: "#3fa9f5" },
];

export function ToolLogo({ tool, size = 28 }: { tool: Tool; size?: number }) {
  if (tool.slug) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny remote brand SVGs, next/image adds no value here
      <img
        src={`https://cdn.simple-icons.org/${tool.slug}`}
        alt={tool.name}
        width={size}
        height={size}
        loading="lazy"
      />
    );
  }
  return (
    <span
      className="tool-monogram"
      style={{ width: size, height: size, color: tool.monogramColor, fontSize: size * 0.42 }}
    >
      {tool.monogram}
    </span>
  );
}
