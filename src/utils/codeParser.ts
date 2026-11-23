export interface CodePiece {
  id: string;
  partNumber: number;
  totalParts?: number;
  label: string;
  code: string;
  lines: number;
}

export function extractCodePieces(markdown: string): CodePiece[] {
  if (!markdown) return [];
  const regex = /```(?:lua|luau)?\s*([\s\S]*?)```/gi;
  const pieces: CodePiece[] = [];
  let match;
  let index = 0;

  while ((match = regex.exec(markdown)) !== null) {
    const rawCode = match[1]?.trim();
    if (!rawCode) continue;

    index++;
    // Check preceding text for "### Part 1: ..." or "Piece 2" or "Section X"
    const textBefore = markdown.substring(Math.max(0, match.index - 160), match.index);
    const partMatch = textBefore.match(/(?:###|##|#)?\s*(?:Part|Piece|Module|Section)\s*([0-9]+)(?:\s*(?:of|\/)\s*([0-9]+))?(?:\s*[:\-–]\s*([^\n]+))?/i);

    let partNum = index;
    let totalParts: number | undefined;
    let label = `Piece ${index}`;

    if (partMatch) {
      partNum = parseInt(partMatch[1], 10) || index;
      if (partMatch[2]) totalParts = parseInt(partMatch[2], 10);
      if (partMatch[3]) label = partMatch[3].trim();
      else label = `Part ${partNum}`;
    }

    pieces.push({
      id: `piece_${index}_${partNum}`,
      partNumber: partNum,
      totalParts,
      label,
      code: rawCode,
      lines: rawCode.split('\n').length,
    });
  }

  return pieces;
}

export function joinAllCodePieces(pieces: CodePiece[]): string {
  if (!pieces || pieces.length === 0) return '';
  return pieces.map((p) => p.code).join('\n\n-- ==========================================\n\n');
}

export function extractLuaCode(markdown: string): string {
  if (!markdown) return '';

  const pieces = extractCodePieces(markdown);
  if (pieces.length > 0) {
    return joinAllCodePieces(pieces);
  }

  // If no code block markdown wrappers, check if it looks like raw Lua
  return markdown;
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Approximation for code: ~3.5 chars per token
  return Math.ceil(text.length / 3.5);
}

export function countLines(text: string): number {
  if (!text) return 1;
  return text.split('\n').length;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  }
}

export function isLuaCode(text: string): boolean {
  if (!text || text.length < 5) return false;
  const luaPatterns = [
    /\blocal\s+[a-zA-Z_]/,
    /\bfunction\s*[a-zA-Z0-9_:.]*\s*\(/,
    /\bgame:GetService\(/,
    /\bInstance\.new\(/,
    /\bVector3\.new\(/,
    /\bCFrame\.new\(/,
    /\bRunService\b/,
    /\bPlayers\.LocalPlayer\b/,
    /\bUserInputService\b/,
    /\bHumanoidRootPart\b/,
    /\bend\b/,
    /\btask\.(?:spawn|delay|wait)\(/,
    /--\[\[[\s\S]*?\]\]/,
    /--[^\n]+/,
  ];
  let hits = 0;
  for (const pattern of luaPatterns) {
    if (pattern.test(text)) hits++;
    if (hits >= 2) return true;
  }
  return false;
}

export function separatePromptAndScript(raw: string): { prompt: string; script: string } {
  if (!raw) return { prompt: '', script: '' };

  // Check 1: Markdown code blocks ```lua ... ```
  const codeBlockRegex = /```(?:lua|luau)?\s*([\s\S]*?)```/i;
  const match = raw.match(codeBlockRegex);
  if (match) {
    const script = match[1].trim();
    const prompt = raw.replace(match[0], '').trim() || 'Edit this Roblox Luau script according to prompt';
    return { prompt, script };
  }

  // Check 2: English prompt followed by Lua code lines
  const lines = raw.split('\n');
  let scriptStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (/^(?:local\s+[a-zA-Z0-9_]+|function\s+[a-zA-Z0-9_]|game:GetService|--!strict|--\[\[|local\s+Players|local\s+RunService)/.test(l)) {
      scriptStart = i;
      break;
    }
  }

  if (scriptStart > 0) {
    const prompt = lines.slice(0, scriptStart).join('\n').trim();
    const script = lines.slice(scriptStart).join('\n').trim();
    if (isLuaCode(script)) {
      return { prompt, script };
    }
  }

  // Check 3: Entire text is pure Lua code
  if (isLuaCode(raw)) {
    return { prompt: 'Optimize, fix, and update this script', script: raw };
  }

  // Check 4: Entire text is pure instruction
  return { prompt: raw, script: '' };
}

export interface MultiScriptDetection {
  isMultiple: boolean;
  scriptCount: number;
  reason: string;
}

export function detectMultiScripts(text: string): MultiScriptDetection {
  if (!text || text.trim().length < 20) {
    return { isMultiple: false, scriptCount: 1, reason: '' };
  }

  // Check 1: 5 or more consecutive newlines (user hitting enter multiple times)
  const newlineSeparated = text.split(/\n{4,}/);
  if (newlineSeparated.length >= 2) {
    const validCodeChunks = newlineSeparated.filter((chunk) => chunk.trim().length > 10);
    if (validCodeChunks.length >= 2) {
      return {
        isMultiple: true,
        scriptCount: validCodeChunks.length,
        reason: 'Separated by 4+ empty lines',
      };
    }
  }

  // Check 2: 5 or more consecutive spaces separating distinct blocks
  const spaceSeparated = text.split(/ {5,}/);
  if (spaceSeparated.length >= 2) {
    const validCodeChunks = spaceSeparated.filter((chunk) => chunk.trim().length > 15 && isLuaCode(chunk));
    if (validCodeChunks.length >= 2) {
      return {
        isMultiple: true,
        scriptCount: validCodeChunks.length,
        reason: 'Separated by 5+ spaces',
      };
    }
  }

  // Check 3: Explicit Script 1 / Script 2 markers or multiple distinct Service headers
  const scriptHeaderMatches = text.match(/(?:--\s*(?:script|module)\s*[1-9]|--\s*part\s*[1-9])/gi);
  if (scriptHeaderMatches && scriptHeaderMatches.length >= 2) {
    return {
      isMultiple: true,
      scriptCount: scriptHeaderMatches.length,
      reason: 'Script markers detected',
    };
  }

  return { isMultiple: false, scriptCount: 1, reason: '' };
}

export function preparePromptPayload(userInput: string, _hasHistory?: boolean): string {
  return userInput.trim();
}

export function cleanDisplayError(raw: string): string {
  if (!raw) return 'An unexpected error occurred while generating code.';
  let text = raw;

  // Check for embedded JSON error strings like {"error":{"message":"..."}}
  if (text.includes('{"error"') || text.includes('{"message"') || text.trim().startsWith('{')) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        let msg = parsed.error?.message || parsed.message || parsed.error;
        if (typeof msg === 'string') {
          try {
            const nested = JSON.parse(msg);
            if (nested.error?.message) msg = nested.error.message;
            else if (nested.message) msg = nested.message;
          } catch {
            // Keep msg as is
          }
          text = msg;
        }
      }
    } catch {
      // Fallback to text
    }
  }

  if (text.includes('no longer available') || text.includes('deprecated')) {
    return 'Google updated the model pipeline. tintware coding ai is running on active Gemini 3.7 & 3.8 models. Click "Retry" below.';
  }
  if (text.includes('503') || text.includes('high demand') || text.includes('UNAVAILABLE')) {
    return 'The AI service experienced a momentary high-demand spike. Click "Retry With Backup Model" to switch to backup models.';
  }
  if (text.includes('429') || text.includes('RESOURCE_EXHAUSTED') || text.includes('quota')) {
    return 'Model rate limit reached. Click "Retry With Backup Model" to switch to another active model tier.';
  }

  return text;
}

