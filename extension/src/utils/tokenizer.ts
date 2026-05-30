/**
 * Local Token Estimation Engine
 * 
 * Since we don't want to use paid APIs or bulky WASM files that can break
 * inside chrome content scripts, we implement a rule-based token estimation.
 * 
 * Rules:
 * - English text: ~4.0 characters per token
 * - Code/Programming syntax: ~3.0 characters per token
 * - Spaces, tabs and special characters are counted more heavily.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  
  const charCount = text.length;
  if (charCount === 0) return 0;

  // Detect code (JSON, JS, Python, HTML, CSS etc.)
  const codePatterns = [
    /[{}\[\];]/g,       // brackets and semicolons
    /\b(const|let|var|function|def|import|class|return|if|else|for|while)\b/g, // keywords
    /[<>=\-+*/&|!%]/g    // operators
  ];
  
  let codeFeatureScore = 0;
  for (const pattern of codePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      codeFeatureScore += matches.length;
    }
  }

  // If density of programming constructs is high, use code ratio
  const codeDensity = codeFeatureScore / charCount;
  const charsPerToken = codeDensity > 0.05 ? 3.0 : 4.0;
  
  // Calculate tokens
  let tokens = Math.ceil(charCount / charsPerToken);
  
  // Adjust for excessive whitespace (which gets tokenized into individual tokens)
  const whitespaceMatches = text.match(/\s{2,}/g);
  if (whitespaceMatches) {
    for (const ws of whitespaceMatches) {
      tokens += Math.ceil(ws.length / 2.0); // whitespace token penalty
    }
  }

  return Math.max(1, tokens);
}
