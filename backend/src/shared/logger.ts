export const logger = {
  info(message: string) {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        timestamp: new Date().toISOString(),
      })
    );
  },

  error(payload: any, message?: string) {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        payload,
        timestamp: new Date().toISOString(),
      })
    );
  },
};
