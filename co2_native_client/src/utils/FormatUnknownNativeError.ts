export function unknownNativeErrorTryFormat(error: unknown): string {
    let errorString = 'Error as attempted formatting: ';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).message) {
      errorString += 'Has a message: "';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errorString += String((error as any).message);
      errorString += '"';
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code) {
      errorString += ' Has a code: "';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errorString += String((error as any).code);
      errorString += '"';
    }
  
    errorString += '\r\n...All other fields as JSON: ';
    errorString += JSON.stringify(error);
    console.warn(errorString);
    return errorString;
  }

