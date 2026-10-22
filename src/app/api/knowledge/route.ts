import { NextRequest, NextResponse } from 'next/server';
import { knowledgeRepository } from '@/backend/repositories/KnowledgeRepository';

export async function GET(req: NextRequest) {
  try {
    await knowledgeRepository.ensureHydrated();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || undefined;
    const category = searchParams.get('category') || undefined;
    const filament = searchParams.get('filament') || undefined;
    const printerId = searchParams.get('printerId') || undefined;

    const entries = knowledgeRepository.searchEntries(query, category, filament, printerId);
    const all = knowledgeRepository.getAllEntries();

    const categoryCounts: Record<string, number> = {};
    for (const e of all) {
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    }

    const items = entries.map((e) => ({
      ...e,
      content: e.solutionText || e.problemSymptom || '',
      triggerCondition:
        typeof e.triggerCondition === 'string'
          ? e.triggerCondition
          : e.triggerCondition?.description || '',
    }));

    return NextResponse.json({
      success: true,
      entries,
      items,
      totalCount: all.length,
      filteredCount: entries.length,
      categoryCounts,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      title,
      category,
      defectType,
      severity,
      solutionText,
      content,
      explanation,
      problemSymptom,
      rootCause,
      slicerOverrides,
      triggerCondition,
      autoFixPatch,
      submittedBy,
      applicablePrinters,
      applicableFilaments,
      tags,
      isVerified,
      confidenceScore,
      sourcePlatform,
    } = body;

    const effectiveSolution = (solutionText || content || explanation || '').trim();

    if (!title || !effectiveSolution) {
      return NextResponse.json(
        { success: false, error: 'Tiêu đề lỗi và giải pháp chi tiết là bắt buộc.' },
        { status: 400 }
      );
    }

    const saved = await knowledgeRepository.upsertEntryAsync({
      id,
      title,
      category: category || 'simulator_defect_learning',
      defectType: defectType || 'custom_defect',
      severity: severity || 'medium',
      solutionText: effectiveSolution,
      problemSymptom,
      rootCause,
      slicerOverrides,
      triggerCondition,
      autoFixPatch,
      submittedBy: submittedBy || 'user_contribution',
      applicablePrinters: applicablePrinters || ['all'],
      applicableFilaments: applicableFilaments || ['PLA', 'PETG'],
      tags: tags || ['defect_learning', '3dsim'],
      isVerified: isVerified !== undefined ? Boolean(isVerified) : true,
      confidenceScore: confidenceScore !== undefined ? Number(confidenceScore) : 94,
      verificationCount: body.verificationCount || 1,
      sourcePlatform: sourcePlatform || 'user_contributed',
    });

    return NextResponse.json({
      success: true,
      entry: {
        ...saved,
        content: saved.solutionText,
      },
      message: 'Đã lưu dữ liệu lỗi & giải thích chi tiết lên Supabase Cloud Database!',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu tham số ID tri thức cần xóa' }, { status: 400 });
    }

    const deleted = await knowledgeRepository.deleteEntryAsync(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bản ghi tri thức' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Đã xóa bản ghi tri thức trên Supabase Database' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
