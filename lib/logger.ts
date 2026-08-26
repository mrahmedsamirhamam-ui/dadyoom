const isDevelopment =
  process.env.NODE_ENV === "development";

export const logger = {
  debug(
    message: string,
    ...data: unknown[]
  ) {
    if (!isDevelopment) {
      return;
    }

    console.debug(
      message,
      ...data
    );
  },

  info(
    message: string,
    ...data: unknown[]
  ) {
    if (!isDevelopment) {
      return;
    }

    console.info(
      message,
      ...data
    );
  },

  warn(
    message: string,
    ...data: unknown[]
  ) {
    console.warn(
      message,
      ...data
    );
  },

  error(
    message: string,
    ...data: unknown[]
  ) {
    console.error(
      message,
      ...data
    );
  },
};
