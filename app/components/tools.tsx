"use client";

/**
 * Shared tool/logo data for the tech-stack marquees and the per-project
 * stack icons in Projects.tsx. Tools with real local assets in
 * public/logos/ use those directly; the handful still referenced only by
 * individual project stacks (Hostinger, Vercel, GSAP) fall back to the
 * simple-icons CDN since no local file exists for them yet. Tools without
 * either render as a styled monogram badge instead so nothing 404s.
 */
export type Tool = {
  name: string;
  slug?: string; // simple-icons CDN slug fallback (no local asset)
  monogram?: string; // fallback badge text
  monogramColor?: string;
  icon?: string; // local /logos/<x>-icon.svg
  // The icon's own artwork is black/near-black (or otherwise low-contrast
  // against this site's near-black theme) - render it on a light backing
  // so it stays visible. Checked per-logo, not a blanket fix - most of
  // these ship colorful brand marks that are already fine as-is.
  needsLightBacking?: boolean;
};

export const TOOLS: Tool[] = [
  { name: "Figma", icon: "/logos/figma-icon.svg" },
  { name: "Canva", icon: "/logos/canva-icon.svg" },
  { name: "Next.js", icon: "/logos/nextjs-icon.svg", needsLightBacking: true },
  { name: "React", icon: "/logos/react-icon.svg" },
  { name: "TypeScript", icon: "/logos/typescript-icon.svg" },
  { name: "JavaScript", icon: "/logos/javascript-icon.svg" },
  { name: "Illustrator", icon: "/logos/illustrator-icon.svg" },
  { name: "Photoshop", icon: "/logos/photoshop-icon.svg" },
  { name: "Hostinger", slug: "hostinger" },
  { name: "HTML5", icon: "/logos/html5-icon.svg" },
  { name: "CSS3", icon: "/logos/css3-icon.svg" },
  { name: "Node.js", icon: "/logos/nodejs-icon.svg" },
  { name: "Git", icon: "/logos/git-icon.svg" },
  { name: "GitHub", icon: "/logos/github-icon.svg", needsLightBacking: true },
  { name: "Vercel", slug: "vercel" },
  { name: "Three.js", icon: "/logos/threejs-icon.svg", needsLightBacking: true },
  { name: "GSAP", slug: "gsap" },
  { name: "VS Code", icon: "/logos/vscode-icon.svg", needsLightBacking: true },
];

/** The curated subset with real local assets - used by the two tech-stack
 *  marquees (LogoCloud, WorkingStyle's StackColumns) so every chip in
 *  those specifically is a real brand asset, not a CDN fetch. */
export const MARQUEE_TOOLS: Tool[] = TOOLS.filter((t) => t.icon);

export function ToolLogo({ tool, size = 28 }: { tool: Tool; size?: number }) {
  if (tool.icon) {
    const img = (
      // eslint-disable-next-line @next/next/no-img-element -- static local SVG, next/image adds no value at this size
      <img
        src={tool.icon}
        alt={tool.name}
        width={tool.needsLightBacking ? Math.round(size * 0.68) : size}
        height={tool.needsLightBacking ? Math.round(size * 0.68) : size}
        loading="lazy"
      />
    );
    if (tool.needsLightBacking) {
      return (
        <span className="tool-icon-backing" style={{ width: size, height: size }}>
          {img}
        </span>
      );
    }
    return img;
  }
  if (tool.slug) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny remote brand SVG, next/image adds no value here
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
