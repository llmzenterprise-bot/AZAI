import type { MetadataRoute } from 'next';

// Private/account pages carry no unique public content and are the same
// shell across all three locales — kept out of the index to avoid thin
// duplicate-content pages competing with the real marketing pages.
const DISALLOW = ['/*/login', '/*/register', '/*/appointments', '/api/'];

const AI_CRAWLERS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'Google-Extended',
  'PerplexityBot', 'Perplexity-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot',
  'anthropic-ai', 'cohere-ai', 'Amazonbot', 'Applebot', 'Applebot-Extended',
  'meta-externalagent', 'Bytespider', 'CCBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/', disallow: DISALLOW })),
    ],
    sitemap: 'https://app.azaigeeks.com/sitemap.xml',
  };
}
