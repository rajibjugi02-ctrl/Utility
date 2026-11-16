import { NextRequest, NextResponse } from 'next/server';

interface ExtractedDesign {
  title: string;
  description: string;
  url: string;
  domain: string;
  aesthetic: string;
  colors: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    primary: string;
    border: string;
    palette: string[];
    cssVariables: Record<string, string>;
  };
  typography: {
    fontFamilies: string[];
    primaryFont: string;
    monoFont: string;
    scale: string[];
  };
  components: {
    borderRadius: string;
    boxShadow: string;
    backdropFilter: string;
    navbarStyle: string;
    layoutType: string;
    features: string[];
  };
}

export async function POST(req: NextRequest) {
  try {
    const { url, format = 'universal' } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL target tidak valid.' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: 'Format URL salah.' }, { status: 400 });
    }

    const domain = parsedUrl.hostname.replace(/^www\./, '');

    // Fetch live website HTML
    let html = '';
    try {
      const response = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(9000),
      });
      html = await response.text();
    } catch (err: any) {
      return NextResponse.json(
        { error: `Gagal mengakses website ${domain}: ${err?.message || 'Koneksi timeout'}` },
        { status: 502 }
      );
    }

    // 1. Meta Extraction
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : domain;

    const descMatch =
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : `Design system of ${domain}`;

    // 2. Extract Colors & CSS Variables
    const hexColorMatches = html.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g) || [];
    const colorFrequency: Record<string, number> = {};
    hexColorMatches.forEach((hex) => {
      const normalized = hex.toUpperCase();
      if (normalized !== '#FFF' && normalized !== '#FFFFFF' && normalized !== '#000' && normalized !== '#000000') {
        colorFrequency[normalized] = (colorFrequency[normalized] || 0) + 1;
      }
    });

    const sortedPalette = Object.entries(colorFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([color]) => color)
      .slice(0, 8);

    // CSS variables extraction
    const cssVars: Record<string, string> = {};
    const varMatches = html.matchAll(/--([a-zA-Z0-9_-]+)\s*:\s*([^;}\n]+)/g);
    for (const match of Array.from(varMatches).slice(0, 20)) {
      const key = `--${match[1].trim()}`;
      const val = match[2].trim();
      if (val.length < 35 && !val.includes('{')) {
        cssVars[key] = val;
      }
    }

    // Determine primary & background
    const isDarkWebsite =
      html.includes('dark') ||
      html.includes('bg-neutral-900') ||
      html.includes('bg-black') ||
      html.includes('#0D0D0D') ||
      html.includes('#0A0A0A');

    const background = cssVars['--background'] || (isDarkWebsite ? '#0D0D0D' : '#F8F9FA');
    const surface = cssVars['--surface'] || cssVars['--card'] || (isDarkWebsite ? '#161616' : '#FFFFFF');
    const text = cssVars['--foreground'] || (isDarkWebsite ? '#EDEDED' : '#111827');
    const textMuted = cssVars['--muted-foreground'] || (isDarkWebsite ? '#9CA3AF' : '#6B7280');
    const primary = cssVars['--primary'] || sortedPalette[0] || (isDarkWebsite ? '#60A5FA' : '#2563EB');
    const border = cssVars['--border'] || (isDarkWebsite ? '#262626' : '#E5E7EB');

    // 3. Extract Typography & Fonts
    const fontFamilies = new Set<string>();
    const googleFontMatches = Array.from(html.matchAll(/family=([a-zA-Z0-9+]+)/g));
    for (const match of googleFontMatches) {
      fontFamilies.add(decodeURIComponent(match[1].replace(/\+/g, ' ')));
    }

    const inlineFontMatches = html.matchAll(/font-family\s*:\s*([^;}\n]+)/g);
    for (const match of Array.from(inlineFontMatches).slice(0, 10)) {
      const cleanFont = match[1].split(',')[0].replace(/['"]/g, '').trim();
      if (cleanFont && cleanFont.length < 24 && !cleanFont.includes('inherit')) {
        fontFamilies.add(cleanFont);
      }
    }

    const fontsList = Array.from(fontFamilies);
    const primaryFont = fontsList[0] || 'Inter, -apple-system, sans-serif';
    const monoFont = fontsList.find((f) => f.toLowerCase().includes('mono')) || 'JetBrains Mono, monospace';

    // 4. Extract Layout & Component Characteristics
    const hasBentoGrid = html.includes('grid-cols') || html.includes('bento') || html.includes('col-span');
    const hasGlassmorphism = html.includes('backdrop-blur') || html.includes('backdrop-filter');
    const hasBrutalism = html.includes('shadow-[') || html.includes('border-2') || html.includes('border-black');

    const borderRadius = html.includes('rounded-full')
      ? 'Pill / Rounded Full'
      : html.includes('rounded-2xl')
      ? '16px (rounded-2xl)'
      : html.includes('rounded-xl')
      ? '12px (rounded-xl)'
      : '8px (rounded-lg)';

    const boxShadow = hasBrutalism
      ? 'Hard Offset Shadow (4px 4px 0px #000000)'
      : 'Soft Layered Diffuse (0 10px 30px -10px rgba(0,0,0,0.1))';

    const backdropFilter = hasGlassmorphism ? 'blur(16px) saturate(180%)' : 'None';
    const layoutType = hasBentoGrid ? 'Bento Grid Layout Architecture' : 'Fluid Flexbox Column Grid';
    const navbarStyle = html.includes('fixed') || html.includes('sticky')
      ? 'Floating Sticky Pill Navbar with Backdrop Blur'
      : 'Standard Full-width Header';

    const aesthetic = hasBrutalism
      ? 'Neo-Brutalism Modern Minimalist'
      : hasGlassmorphism
      ? 'Dark Mode Glassmorphic High-Tech'
      : 'Clean Minimalist Editorial SaaS';

    const designTokens: ExtractedDesign = {
      title,
      description,
      url: parsedUrl.toString(),
      domain,
      aesthetic,
      colors: {
        background,
        surface,
        text,
        textMuted,
        primary,
        border,
        palette: sortedPalette.length > 0 ? sortedPalette : ['#2563EB', '#10B981', '#F59E0B', '#EF4444'],
        cssVariables: cssVars,
      },
      typography: {
        fontFamilies: fontsList.length > 0 ? fontsList : ['Inter', 'sans-serif'],
        primaryFont,
        monoFont,
        scale: ['12px (xs)', '14px (sm)', '16px (base)', '20px (lg)', '28px (2xl)', '40px (4xl)'],
      },
      components: {
        borderRadius,
        boxShadow,
        backdropFilter,
        navbarStyle,
        layoutType,
        features: [
          hasBentoGrid ? 'Bento Card Grid Layout' : 'Fluid Modular Cards',
          hasGlassmorphism ? 'Frosted Glass Surface' : 'Crisp Solid Surface',
          hasBrutalism ? 'Tactile Click Physics & Hard Shadows' : 'Smooth Hover Scale & Transitions',
          'High Contrast WCAG AA Accessibility',
        ],
      },
    };

    // 5. Generate Structured Markdown (.MD) Document
    const markdownContent = buildMarkdownPrompt(designTokens, format);

    return NextResponse.json({
      success: true,
      metadata: {
        title,
        domain,
        url: parsedUrl.toString(),
      },
      designTokens,
      markdownContent,
    });
  } catch (error: any) {
    console.error('Design Extraction API Error:', error);
    return NextResponse.json(
      { error: `Internal design extraction error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

function buildMarkdownPrompt(data: ExtractedDesign, format: string): string {
  const dateStr = new Date().toISOString().split('T')[0];

  if (format === 'cursor') {
    return `# Design Rules & Visual Guidelines: ${data.domain}
Generated: ${dateStr} from ${data.url}

## Role & System Prompt
You are an expert Frontend Architect & UI/UX Design Systems Engineer. When generating or modifying components, you must strictly follow the aesthetic and design tokens extracted from **${data.domain}**.

## Visual Aesthetic & Theme
- **Style Direction:** ${data.aesthetic}
- **Layout Model:** ${data.components.layoutType}
- **Navbar System:** ${data.components.navbarStyle}

## Color Palette Tokens
\`\`\`css
:root {
  --bg-primary: ${data.colors.background};
  --surface-card: ${data.colors.surface};
  --text-main: ${data.colors.text};
  --text-muted: ${data.colors.textMuted};
  --brand-primary: ${data.colors.primary};
  --border-line: ${data.colors.border};
}
\`\`\`
- **Accent Swatches:** ${data.colors.palette.join(', ')}

## Typography Rules
- **Primary Font:** \`${data.typography.primaryFont}\`
- **Monospace Font:** \`${data.typography.monoFont}\`
- **Hierarchy:** H1 (36px-48px bold), H2 (24px-30px bold), Body (14px-16px normal), Muted (12px-13px font-mono).

## Component Styling Specifications
1. **Cards & Containers:**
   - Radius: \`${data.components.borderRadius}\`
   - Shadow: \`${data.components.boxShadow}\`
   - Backdrop Filter: \`${data.components.backdropFilter}\`
2. **Interactive Elements:**
   - Buttons must have clear tactile states: hover, active press, and focus-visible outlines.
   - Avoid generic AI slop comments or decorative banners.
`;
  }

  if (format === 'v0') {
    return `Create a high-fidelity modern web application inspired by the UI/UX design system of ${data.domain}.

### Visual Identity & Aesthetic
- Aesthetic: ${data.aesthetic}
- Layout: ${data.components.layoutType}
- Card Style: ${data.components.borderRadius} border-radius with ${data.components.boxShadow}.

### Color Palette
- Background: \`${data.colors.background}\`
- Surface / Cards: \`${data.colors.surface}\`
- Main Typography: \`${data.colors.text}\`
- Secondary / Muted: \`${data.colors.textMuted}\`
- Brand Accent: \`${data.colors.primary}\`
- Border: \`${data.colors.border}\`
- Dominant Colors: ${data.colors.palette.slice(0, 5).join(', ')}

### Typography
- Primary Sans: \`${data.typography.primaryFont}\`
- Monospace Numbers & Badges: \`${data.typography.monoFont}\`

### Navigation & Header
- ${data.components.navbarStyle}
`;
  }

  // Universal Design System .MD (Default)
  return `# Design System Specification & Prompt
**Source Website:** [${data.domain}](${data.url})  
**Document Generated:** ${dateStr}  
**Aesthetic Framework:** ${data.aesthetic}

---

## 1. System Persona & Engineering Directives
Act as a Principal Design Systems Engineer and Lead Frontend Developer. Build clean, modular, and maintainable user interfaces replicating the exact design language, component tokens, and visual balance of **${data.domain}**.

---

## 2. Core Color Tokens
| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| \`--background\` | \`${data.colors.background}\` | Main application backdrop |
| \`--surface\` | \`${data.colors.surface}\` | Card containers and elevated surfaces |
| \`--foreground\` | \`${data.colors.text}\` | Primary high-contrast text |
| \`--muted\` | \`${data.colors.textMuted}\` | Captions, secondary labels, and timestamps |
| \`--primary\` | \`${data.colors.primary}\` | Primary action buttons and focal elements |
| \`--border\` | \`${data.colors.border}\` | Structural bounding lines and dividers |

### Dominant Color Palette
${data.colors.palette.map((c) => `- \`${c}\``).join('\n')}

---

## 3. Typography Hierarchy
- **Primary Typeface:** \`${data.typography.primaryFont}\`
- **Monospace Typeface:** \`${data.typography.monoFont}\`
- **Type Scale:**
${data.typography.scale.map((s) => `  - ${s}`).join('\n')}

---

## 4. Component Architecture & Micro-Interactions
- **Border Radius:** \`${data.components.borderRadius}\`
- **Elevation / Shadow:** \`${data.components.boxShadow}\`
- **Backdrop Effects:** \`${data.components.backdropFilter}\`
- **Navigation Model:** ${data.components.navbarStyle}
- **Structural Model:** ${data.components.layoutType}

### Feature Highlights
${data.components.features.map((f) => `- ${f}`).join('\n')}

---

## 5. Tailwind CSS Configuration Preset
\`\`\`javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '${data.colors.background}',
        surface: '${data.colors.surface}',
        primary: '${data.colors.primary}',
        border: '${data.colors.border}',
      },
      fontFamily: {
        sans: ['${data.typography.primaryFont.split(',')[0]}', 'sans-serif'],
        mono: ['${data.typography.monoFont.split(',')[0]}', 'monospace'],
      },
    },
  },
};
\`\`\`
`;
}
