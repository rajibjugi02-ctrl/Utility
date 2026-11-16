import { NextRequest } from 'next/server';
import { handleCapCutSearch } from '@/lib/capcutSearchService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleCapCutSearch(req);
}

export async function POST(req: NextRequest) {
  return handleCapCutSearch(req);
}
