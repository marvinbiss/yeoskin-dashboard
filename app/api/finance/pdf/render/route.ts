export const runtime = 'nodejs';
export const maxDuration = 60;

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { logger } from '@/lib/logger';

interface RenderRequest {
  html: string;
  options?: {
    format?: 'A4' | 'Letter';
    landscape?: boolean;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
  };
}

interface RenderResponse {
  pdf_base64: string;
}

export async function POST(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Authenticate with internal API key
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.INTERNAL_API_KEY;

    if (!expectedKey) {
      logger.error({ requestId }, 'INTERNAL_API_KEY not configured');
      return Response.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!apiKey || apiKey !== expectedKey) {
      logger.warn({ requestId }, 'Invalid or missing API key');
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: RenderRequest = await request.json();

    if (!body.html || typeof body.html !== 'string') {
      logger.warn({ requestId }, 'Missing or invalid HTML content');
      return Response.json(
        { error: 'Missing or invalid HTML content' },
        { status: 400 }
      );
    }

    if (body.html.length > 5 * 1024 * 1024) {
      logger.warn({ requestId, size: body.html.length }, 'HTML content too large');
      return Response.json(
        { error: 'HTML content exceeds 5MB limit' },
        { status: 400 }
      );
    }

    logger.info({ requestId, htmlSize: body.html.length }, 'Starting PDF render');

    // Launch browser
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    try {
      const page = await browser.newPage();

      // Set content with timeout
      await page.setContent(body.html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: body.options?.format || 'A4',
        landscape: body.options?.landscape || false,
        margin: body.options?.margin || {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        printBackground: true,
      });

      const pdf_base64 = Buffer.from(pdfBuffer).toString('base64');
      const duration = Date.now() - startTime;

      logger.info(
        { requestId, duration, pdfSize: pdfBuffer.length },
        'PDF render completed'
      );

      const response: RenderResponse = { pdf_base64 };
      return Response.json(response);

    } finally {
      await browser.close();
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      { requestId, duration, error: error instanceof Error ? error.message : 'Unknown error' },
      'PDF render failed'
    );

    return Response.json(
      { error: 'Failed to render PDF' },
      { status: 500 }
    );
  }
}
