import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { ratelimit } from '@/lib/ratelimit';
import { logger } from '@/lib/logger';

export async function GET(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();

  try {
    const { searchParams } = new URL(request.url);
    const statementId = searchParams.get('id');
    const fileType = searchParams.get('type') || 'pdf';

    // Validate parameters
    if (!statementId) {
      return notFoundResponse();
    }

    if (!['pdf', 'csv'].includes(fileType)) {
      return notFoundResponse();
    }

    // Rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      logger.warn({ requestId, ip }, 'Rate limit exceeded for statement download');
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      });
    }

    // Create Supabase client with user session
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string }[]) {
            // Read-only in route handlers for GET requests
          },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn({ requestId }, 'Unauthenticated statement download attempt');
      return notFoundResponse();
    }

    // Fetch statement metadata
    const { data: statement, error: statementError } = await supabase
      .from('creator_statements')
      .select('id, creator_id, pdf_path, csv_path, period_id')
      .eq('id', statementId)
      .single();

    if (statementError || !statement) {
      logger.warn({ requestId, statementId }, 'Statement not found');
      return notFoundResponse();
    }

    // Access control: check if user is owner or admin
    const isOwner = statement.creator_id === user.id;

    let isAdmin = false;
    if (!isOwner) {
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();

      isAdmin = adminUser?.role === 'admin' || adminUser?.role === 'finance';
    }

    // Anti-enumeration: always return 404 if not authorized
    if (!isOwner && !isAdmin) {
      logger.warn(
        { requestId, userId: user.id, statementId },
        'Unauthorized statement download attempt'
      );
      return notFoundResponse();
    }

    // Get the file path
    const filePath = fileType === 'pdf' ? statement.pdf_path : statement.csv_path;

    if (!filePath) {
      logger.warn({ requestId, statementId, fileType }, 'Statement file path not found');
      return notFoundResponse();
    }

    // Create service role client for storage operations
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create signed URL with 1 hour expiry
    const { data: signedUrlData, error: signedUrlError } = await serviceClient
      .storage
      .from('finance')
      .createSignedUrl(filePath, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      logger.error(
        { requestId, statementId, filePath, error: signedUrlError?.message },
        'Failed to create signed URL'
      );
      return notFoundResponse();
    }

    logger.info(
      { requestId, userId: user.id, statementId, fileType },
      'Statement download initiated'
    );

    // Redirect to signed URL
    return Response.redirect(signedUrlData.signedUrl, 302);

  } catch (error) {
    logger.error(
      { requestId, error: error instanceof Error ? error.message : 'Unknown error' },
      'Statement download error'
    );
    return notFoundResponse();
  }
}

function notFoundResponse(): Response {
  return new Response('Not Found', { status: 404 });
}
