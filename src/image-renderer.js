import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';

// Load font (we'll use Inter as a clean, modern font)
async function loadFont() {
  const fontPath = path.join(process.cwd(), 'fonts', 'Inter-Regular.ttf');
  const fontBoldPath = path.join(process.cwd(), 'fonts', 'Inter-Bold.ttf');

  return [
    {
      name: 'Inter',
      data: fs.readFileSync(fontPath),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Inter',
      data: fs.readFileSync(fontBoldPath),
      weight: 700,
      style: 'normal',
    },
  ];
}

/**
 * Build the visual layout for an IG post
 */
function buildIgPostLayout(eventData) {
  const schedule = eventData.schedule || [];

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        color: '#f5f5f5',
        padding: '60px',
        fontFamily: 'Inter',
      },
      children: [
        // Intention / headline
        {
          type: 'div',
          props: {
            style: {
              fontSize: '42px',
              fontWeight: 400,
              lineHeight: 1.4,
              marginBottom: '40px',
              maxWidth: '90%',
            },
            children: eventData.intention || '',
          },
        },
        // Date + Venue
        {
          type: 'div',
          props: {
            style: {
              fontSize: '28px',
              marginBottom: '50px',
              opacity: 0.9,
            },
            children: `${formatDate(eventData.date)} · ${eventData.venue?.name || ''}`,
          },
        },
        // Divider symbol
        {
          type: 'div',
          props: {
            style: {
              fontSize: '24px',
              marginBottom: '40px',
              opacity: 0.6,
            },
            children: '⟡',
          },
        },
        // Schedule
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              fontSize: '24px',
              opacity: 0.85,
            },
            children: schedule.map(item => ({
              type: 'div',
              props: {
                children: `${item.time} · ${item.name}${item.artist ? ` · ${item.artist}` : ''}`,
              },
            })),
          },
        },
        // Bottom heart
        {
          type: 'div',
          props: {
            style: {
              marginTop: 'auto',
              fontSize: '28px',
              opacity: 0.7,
            },
            children: '♡',
          },
        },
      ],
    },
  };
}

/**
 * Format date to "14 february" style
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
  return `${day} ${month}`;
}

/**
 * Render an image from event data
 */
export async function renderImage(eventData, templateName, outputPath) {
  const fonts = await loadFont();

  let layout;
  switch (templateName) {
    case 'ig_post':
      layout = buildIgPostLayout(eventData);
      break;
    default:
      throw new Error(`Unknown image template: ${templateName}`);
  }

  // Generate SVG with satori
  const svg = await satori(layout, {
    width: 1080,
    height: 1080,
    fonts,
  });

  // Convert SVG to PNG
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1080,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  fs.writeFileSync(outputPath, pngBuffer);

  return outputPath;
}
