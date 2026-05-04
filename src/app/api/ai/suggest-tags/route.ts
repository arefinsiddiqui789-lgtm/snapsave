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
            'You are a smart note tagger. Analyze the given text and suggest relevant tags. Return ONLY a JSON array of tag strings (lowercase, single words or short phrases). No explanations, no markdown, just the JSON array. Example: ["work", "meeting", "project"]. Suggest 2-5 tags.',
        },
        {
          role: 'user',
          content: `Suggest tags for this note:\n\n${content}`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return NextResponse.json({ error: 'Failed to suggest tags' }, { status: 500 });
    }

    // Try to parse the JSON array from the response
    let tags: string[] = [];
    try {
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        tags = JSON.parse(match[0]);
      }
    } catch {
      // If parsing fails, extract words from the response
      tags = response
        .split(/[,|\n]/)
        .map((t: string) => t.replace(/["\[\]]/g, '').trim().toLowerCase())
        .filter((t: string) => t.length > 0 && t.length < 20);
    }

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('AI Suggest Tags error:', error);
    return NextResponse.json(
      { error: 'Failed to suggest tags. Please try again.' },
      { status: 500 }
    );
  }
}
