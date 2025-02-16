export function logObject(message: {[key: string]: any}, label?: string) {
  if (label) {
    console.log(`${label}: ${JSON.stringify(message, null, 2)}\n`);
  } else {
    console.log(JSON.stringify(message, null, 2));
  }
}

export function logMessage(message: Parameters<typeof console.log>[0], label?: string) {
  if (label) {
    console.log(`${label}: ${message}\n`);
  } else {
    console.log(message);
  }
}

export function logSeparator(label?: string, separatorLength = 5) {
  const separator = '='.repeat(separatorLength);
  if (label) {
    logMessage(`${separator} ${label} ${separator}\n`);
  } else {
    logMessage(separator.repeat(2));
  }
}
