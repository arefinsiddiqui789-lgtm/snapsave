import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'You are a professional writing assistant. Your job is to improve and polish the given text. Make it clearer, more professional, and better structured while preserving the original meaning and intent. Fix grammar, improve word choice, enhance readability. Return ONLY the improved text, no explanations or metadata.',
        },
        {
          role: 'user',
          content: `Improve this note:\n\n${content}`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const improved = completion.choices[0]?.message?.content;

    if (!improved) {
      return NextResponse.json({ error: 'Failed to improve note' }, { status: 500 });
    }

    return NextResponse.json({ improved });
  } catch (error) {
    console.error('AI Improve error:', error);
    return NextResponse.json(
      { error: 'Failed to improve note. Please try again.' },
      { status: 500 }
    );
  }
}
