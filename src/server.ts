import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';

import { calculateFourPillars } from './calculator.js';

const inputSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe('Local civil date in YYYY-MM-DD format.'),
    time: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
      .describe('Local civil time in HH:mm format.'),
    timezone: z
      .string()
      .min(1)
      .max(80)
      .describe(
        'IANA time zone, for example Asia/Shanghai or America/Los_Angeles.'
      ),
    longitude: z
      .number()
      .finite()
      .min(-180)
      .max(180)
      .describe('Birth longitude in decimal degrees, east positive.'),
    latitude: z
      .number()
      .finite()
      .min(-90)
      .max(90)
      .optional()
      .describe('Optional birth latitude in decimal degrees.'),
  })
  .strict();

const server = new McpServer(
  {
    name: 'four-pillars-mcp',
    title: 'Four Pillars Calculator',
    version: '0.1.0',
  },
  {
    instructions:
      'This server calculates deterministic BaZi Four Pillars from explicit date, time, IANA timezone, and longitude. It does not geocode addresses, store personal data, generate interpretations, or calculate luck cycles.',
  }
);

server.registerTool(
  'calculate_four_pillars',
  {
    description:
      'Calculate the BaZi (Four Pillars) chart from a local birth date, time, IANA timezone, and decimal longitude. The calculation uses local apparent true solar time, astronomical solar-term boundaries, and the 23:00 Zi-hour next-day boundary. Returns only reproducible chart facts and provenance, not interpretation or prediction.',
    inputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (input) => {
    try {
      const result = calculateFourPillars(input);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        structuredContent: result,
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text:
              error instanceof Error ? error.message : 'Calculation failed.',
          },
        ],
      };
    }
  }
);

serveStdio(() => server, {
  onerror: (error) => console.error('four-pillars-mcp error:', error),
});
