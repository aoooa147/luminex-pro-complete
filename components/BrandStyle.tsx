import React from 'react';

const get = (key: string, fallback: string) => (typeof process !== 'undefined' && process.env && (process.env as any)[key]) || fallback;

export default function BrandStyle() {
  // Read NEXT_PUBLIC_* only (safe for client)
  const primary = get('NEXT_PUBLIC_BRAND_PRIMARY', '#6366f1'); // indigo-500
  const accent = get('NEXT_PUBLIC_BRAND_ACCENT', '#14b8a6');  // teal-500
  const bg = get('NEXT_PUBLIC_BRAND_BG', '#000000');          // black
  const card = get('NEXT_PUBLIC_BRAND_CARD', '#0b0b0f');      // near-black
  const font = get('NEXT_PUBLIC_BRAND_FONT', 'Inter');        // Google font name
  const radius = get('NEXT_PUBLIC_BRAND_RADIUS', '1.25rem');  // 20px ~ rounded-3xl

  // logo is used in UI via constants; keep here if you want via CSS var too
  const css = \`:root{
    --brand-primary: \${primary};
    --brand-accent: \${accent};
    --brand-bg: \${bg};
    --brand-card: \${card};
    --brand-radius: \${radius};
    --brand-font: \${font}, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, Noto Sans, 'Apple Color Emoji', 'Segoe UI Emoji';
  }\`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
