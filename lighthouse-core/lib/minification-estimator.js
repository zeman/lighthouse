
// https://www.ecma-international.org/ecma-262/9.0/index.html#prod-Punctuator
const PUNCTUATOR_REGEX = /(return|{|\(|\[|\.\.\.|;|,|<|>|<=|>=|==|!=|===|!==|\+|-|\*|%|\*\*|\+\+|--|<<|>>|>>>|&|\||\^|!|~|&&|\|\||\?|:|=|\+=|-=|\*=|%=|\*\*=|<<=|>>=|>>>=|&=|\|=|\^=|=>)$/
const WHITESPACE_REGEX = /( |\n|\t)+$/

/**
 * @param {string} content
 * @param {number} startPosition
 */
function hasPunctuatorBefore(content, startPosition) {
  for (let i = startPosition - 1; i >= 0; i--) {
    if (i < 3) return true

    const precedingCharacters = content.substr(i - 5, 6);
    if (WHITESPACE_REGEX.test(precedingCharacters)) continue;
    return PUNCTUATOR_REGEX.test(precedingCharacters);
  }

  return true;
}


/**
 *
 * @param {string} content
 * @param {{singlelineComments: boolean, regex: boolean}} features
 */
function computeTokenLength(content, features) {
  let totalTokenLength = 0;
  let isInSinglelineComment = false;
  let isInMultilineComment = false;
  let isInLicenseComment = false;
  let isInString = false;
  let isInRegex = false;
  let stringOpenChar = null;

  for (let i = 0; i < content.length; i++) {
    const twoChars = content.substr(i, 2);
    const char = twoChars.charAt(0);

    const isWhitespace = char === ' ' || char === '\n' || char === '\t';
    const isAStringOpenChar = char === `'` || char === '"' || char === '`';

    if (twoChars === 'yO') debugger

    if (isInSinglelineComment) {
      if (char === '\n') {
        // console.log(i, 'leaving comment')
        // End the comment when you hit a newline
        isInSinglelineComment = false;
      }
    } else if (isInMultilineComment) {
      // License comments count
      if (isInLicenseComment) totalTokenLength++;

      if (twoChars === '*/') {
        // License comments count, account for the '/' character we're skipping over
        if (isInLicenseComment) totalTokenLength++;
        // End the comment when we hit the closing sequence
        isInMultilineComment = false;
        // Skip over the '/' character since we've already processed it
        i++;
      }
    } else if (isInString) {
      // String characters count
      totalTokenLength++;

      if (char === '\\') {
        // Skip over any escaped characters
        totalTokenLength++;
        i++;
      } else if (char === stringOpenChar) {
        // End the string when we hit the same stringOpenCharacter
        isInString = false;
        // console.log(i, 'exiting string', stringOpenChar)
      }
    } else if (isInRegex) {
      // Regex characters count
      totalTokenLength++;

      if (char === '\\') {
        // Skip over any escaped characters
        totalTokenLength++;
        i++;
      } else if (char === '/') {
        // End the string when we hit the regex close character
        isInRegex = false;
        // console.log(i, 'leaving regex', char)
      }
    } else {
      if (twoChars === '/*') {
        // Start the multi-line comment
        isInMultilineComment = true;
        // Check if it's a license comment so we know whether to count it
        isInLicenseComment = content.charAt(i + 2) === '!';
        // += 2 because we are processing 2 characters, not just 1
        if (isInLicenseComment) totalTokenLength += 2;
        // Skip over the '*' character since we've already processed it
        i++;
      } else if (twoChars === '//' && features.singlelineComments) {
        // console.log(i, 'entering comment')
        // Start the single-line comment
        isInSinglelineComment = true;
        isInMultilineComment = false;
        isInLicenseComment = false;
        // Skip over the second '/' character since we've already processed it
        i++;
      } else if (char === '/' && features.regex && hasPunctuatorBefore(content, i)) {
        // Start the regex
        isInRegex = true;
        // Regex characters count
        totalTokenLength++;
        // console.log(i, 'entering regex', char)
      } else if (isAStringOpenChar) {
        // Start the string
        isInString = true;
        // Save the open character for later so we know when to close it
        stringOpenChar = char;
        // String characters count
        totalTokenLength++;
        // console.log(i, 'entering string', char)
      } else if (!isWhitespace) {
        // All non-whitespace, non-semicolon characters count
        totalTokenLength++;
      }
    }
  }

  // console.log(content.substr(50081 - 80, 82))

  // If the content contained unbalanced comments, it's either invalid or we had a parsing error.
  // Report the token length as the entire string so it will be ignored.
  if (isInMultilineComment || isInString) {
    return content.length;
  }

  return totalTokenLength;
}

/**
 * @param {string} content
 */
function computeJSTokenLength(content) {
  return computeTokenLength(content, {singlelineComments: true, regex: true})
}

/**
 * @param {string} content
 */
function computeCSSTokenLength(content) {
  return computeTokenLength(content, {singlelineComments: false, regex: false})
}

module.exports = {computeJSTokenLength, computeCSSTokenLength}
