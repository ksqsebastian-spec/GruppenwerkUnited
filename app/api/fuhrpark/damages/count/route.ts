import { NextResponse } from 'next/server';
import { countOpenDamages } from '@/lib/database/damages';

export async function GET(): Promise<NextResponse> {
  try {
    const count = await countOpenDamages();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ error: 'Schadensanzahl konnte nicht geladen werden' }, { status: 500 });
  }
}
