const MAX_EXPRESSION_LENGTH = 96;

export function setAmountOperator(input: string, operator: "+" | "-" | "*" | "/"): string {
  const operand = input.trimEnd().replace(/(?:\s*[+\-*/])+$/, "").trimEnd();
  if (!/[\d)]$/.test(operand) && !/\d[.,]$/.test(operand)) {
    return input;
  }
  return `${operand} ${operator} `;
}

export function evaluateAmountExpression(input: string): number {
  const source = input.replace(/,/g, ".").replace(/\s+/g, "");
  if (!source || source.length > MAX_EXPRESSION_LENGTH || /[^0-9+\-*/().]/.test(source)) {
    throw new Error("Invalid amount expression.");
  }

  let position = 0;

  function parseNumber(): number {
    const start = position;
    let decimalPoints = 0;
    while (position < source.length && /[0-9.]/.test(source[position])) {
      if (source[position] === ".") {
        decimalPoints += 1;
      }
      position += 1;
    }
    const token = source.slice(start, position);
    if (!token || token === "." || decimalPoints > 1) {
      throw new Error("Invalid number.");
    }
    return Number(token);
  }

  function parseFactor(): number {
    if (source[position] === "+") {
      position += 1;
      return parseFactor();
    }
    if (source[position] === "-") {
      position += 1;
      return -parseFactor();
    }
    if (source[position] === "(") {
      position += 1;
      const result = parseExpression();
      if (source[position] !== ")") {
        throw new Error("Missing closing parenthesis.");
      }
      position += 1;
      return result;
    }
    return parseNumber();
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (source[position] === "*" || source[position] === "/") {
      const operator = source[position];
      position += 1;
      const right = parseFactor();
      if (operator === "/" && right === 0) {
        throw new Error("Division by zero.");
      }
      result = operator === "*" ? result * right : result / right;
    }
    return result;
  }

  function parseExpression(): number {
    let result = parseTerm();
    while (source[position] === "+" || source[position] === "-") {
      const operator = source[position];
      position += 1;
      const right = parseTerm();
      result = operator === "+" ? result + right : result - right;
    }
    return result;
  }

  const result = parseExpression();
  if (position !== source.length || !Number.isFinite(result) || result <= 0) {
    throw new Error("Amount must be positive.");
  }
  return result;
}
