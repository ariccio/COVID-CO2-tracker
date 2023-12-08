export function unknownErrorTryFormat(error: unknown): string {
    let errorString = 'Error as attempted generic formatting: ';
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
  
    
    errorString += '\r\n...All other JSONable fields as JSON: ';
    errorString += JSON.stringify(error);

    const allPropertyNames = Object.getOwnPropertyNames(error);
    errorString += '\r\n...Object property names: ';
    errorString += allPropertyNames.toString();

    const allPropertyDescriptors = Object.getOwnPropertyDescriptors(error);
    errorString += '\r\n...Object property descriptors: ';
    errorString += JSON.stringify(allPropertyDescriptors);

    console.warn(errorString);
    return errorString;
  }

