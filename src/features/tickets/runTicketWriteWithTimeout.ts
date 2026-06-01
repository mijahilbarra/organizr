export async function runTicketWriteWithTimeout<T>(operation: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Firestore did not acknowledge the ticket write. Check Firestore rules and client network access."));
    }, 10000);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
