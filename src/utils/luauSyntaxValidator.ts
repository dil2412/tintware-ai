/**
 * Lightweight, fast Luau / Lua syntax integrity analyzer.
 * Checks for block matching, bracket balance, unclosed strings, and common invalid operators.
 */

export interface SyntaxCheckResult {
  isValid: boolean;
  issues: string[];
  openBlocks: number;
  openParens: number;
  openBraces: number;
  openBrackets: number;
  lineCount: number;
}

export function validateLuauSyntax(code: string): SyntaxCheckResult {
  if (!code || !code.trim()) {
    return {
      isValid: true,
      issues: [],
      openBlocks: 0,
      openParens: 0,
      openBraces: 0,
      openBrackets: 0,
      lineCount: 0,
    };
  }

  const issues: string[] = [];
  const lines = code.split('\n');

  let openParens = 0;
  let openBraces = 0;
  let openBrackets = 0;

  // Track block nesting: function, if, for, while, do, repeat
  const blockStack: { type: string; line: number }[] = [];

  let inMultiComment = false;
  let inMultiString = false;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const rawLine = lines[lineIdx];
    const lineNum = lineIdx + 1;

    // Check for common Luau syntax mistakes (e.g. != instead of ~=)
    if (!rawLine.trim().startsWith('--')) {
      if (rawLine.includes('!=')) {
        issues.push(`Line ${lineNum}: Luau uses '~=' for inequality, not '!='.`);
      }
      if (rawLine.includes('&&')) {
        issues.push(`Line ${lineNum}: Luau uses 'and', not '&&'.`);
      }
      if (rawLine.includes('||')) {
        issues.push(`Line ${lineNum}: Luau uses 'or', not '||'.`);
      }
      if (rawLine.includes('===') || rawLine.includes('!==')) {
        issues.push(`Line ${lineNum}: JavaScript equality operators detected. Use '==' or '~=' in Luau.`);
      }
    }

    // Tokenize line character by character to strip comments and strings safely
    let i = 0;
    while (i < rawLine.length) {
      if (inMultiComment) {
        if (rawLine.substring(i, i + 2) === ']]') {
          inMultiComment = false;
          i += 2;
        } else {
          i++;
        }
        continue;
      }

      if (inMultiString) {
        if (rawLine.substring(i, i + 2) === ']]') {
          inMultiString = false;
          i += 2;
        } else {
          i++;
        }
        continue;
      }

      // Check comments
      if (rawLine.substring(i, i + 4) === '--[[') {
        inMultiComment = true;
        i += 4;
        continue;
      }
      if (rawLine.substring(i, i + 2) === '--') {
        // Single line comment, rest of line is ignored
        break;
      }

      // Check multi-line string
      if (rawLine.substring(i, i + 2) === '[[') {
        inMultiString = true;
        i += 2;
        continue;
      }

      // Check single-line strings
      const char = rawLine[i];
      if (char === '"' || char === "'") {
        const quote = char;
        i++;
        let closed = false;
        while (i < rawLine.length) {
          if (rawLine[i] === '\\') {
            i += 2; // skip escaped char
            continue;
          }
          if (rawLine[i] === quote) {
            closed = true;
            i++;
            break;
          }
          i++;
        }
        if (!closed) {
          issues.push(`Line ${lineNum}: Unclosed string literal (${quote}).`);
        }
        continue;
      }

      // Brackets
      if (char === '(') openParens++;
      else if (char === ')') {
        openParens--;
        if (openParens < 0) {
          issues.push(`Line ${lineNum}: Extra closing parenthesis ')' without matching '('.`);
          openParens = 0;
        }
      } else if (char === '{') openBraces++;
      else if (char === '}') {
        openBraces--;
        if (openBraces < 0) {
          issues.push(`Line ${lineNum}: Extra closing brace '}' without matching '{'.`);
          openBraces = 0;
        }
      } else if (char === '[') openBrackets++;
      else if (char === ']') {
        openBrackets--;
        if (openBrackets < 0) {
          issues.push(`Line ${lineNum}: Extra closing square bracket ']' without matching '['.`);
          openBrackets = 0;
        }
      }

      i++;
    }

    // Now analyze words outside of comments/strings on this line for block keywords
    // Clean string contents from line for keyword search
    const cleanLine = rawLine
      .replace(/--.*$/, '')
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''");

    const words = cleanLine.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) || [];

    for (let wIdx = 0; wIdx < words.length; wIdx++) {
      const word = words[wIdx];
      const prevWord = wIdx > 0 ? words[wIdx - 1] : '';

      if (word === 'function') {
        blockStack.push({ type: 'function', line: lineNum });
      } else if (word === 'if') {
        blockStack.push({ type: 'if', line: lineNum });
      } else if (word === 'while') {
        blockStack.push({ type: 'while', line: lineNum });
      } else if (word === 'for') {
        blockStack.push({ type: 'for', line: lineNum });
      } else if (word === 'do') {
        // In Lua, 'while ... do' and 'for ... do' share the same 'end', so don't double count if preceded by while/for
        if (prevWord !== 'while' && prevWord !== 'for') {
          blockStack.push({ type: 'do', line: lineNum });
        }
      } else if (word === 'repeat') {
        blockStack.push({ type: 'repeat', line: lineNum });
      } else if (word === 'until') {
        // Closes a repeat block
        const lastRepeatIdx = [...blockStack].reverse().findIndex((b) => b.type === 'repeat');
        if (lastRepeatIdx !== -1) {
          const actualIdx = blockStack.length - 1 - lastRepeatIdx;
          blockStack.splice(actualIdx, 1);
        } else {
          issues.push(`Line ${lineNum}: 'until' without preceding 'repeat'.`);
        }
      } else if (word === 'end') {
        // Closes a function, if, while, for, or do block
        if (blockStack.length > 0) {
          blockStack.pop();
        } else {
          issues.push(`Line ${lineNum}: Unexpected 'end' with no opening block.`);
        }
      }
    }
  }

  if (openParens > 0) {
    issues.push(`Unclosed parentheses: ${openParens} missing ')'.`);
  }
  if (openBraces > 0) {
    issues.push(`Unclosed table/braces: ${openBraces} missing '}'.`);
  }
  if (openBrackets > 0) {
    issues.push(`Unclosed square brackets: ${openBrackets} missing ']'.`);
  }
  if (blockStack.length > 0) {
    const unclosed = blockStack.map((b) => `'${b.type}' (line ${b.line})`).join(', ');
    issues.push(`Missing 'end' statement(s): ${blockStack.length} unclosed block(s): ${unclosed}.`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    openBlocks: blockStack.length,
    openParens,
    openBraces,
    openBrackets,
    lineCount: lines.length,
  };
}
