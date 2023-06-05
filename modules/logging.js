const winston = require("winston");
const path = require("path");

var logger;

var enumerateErrorFormat = winston.format((info) => {
  if (info.message instanceof Error) {
    info.message = Object.assign(
      {
        message: info.message.message,
        stack: info.message.stack,
      },
      info.message
    );
  }

  if (info instanceof Error) {
    return Object.assign(
      {
        message: info.message,
        stack: info.stack,
      },
      info
    );
  }

  return info;
});

module.exports = function (directory) {
  if (!logger) {
    logger = winston.createLogger({
      transports: [
        new winston.transports.File({
          filename: path.join(__dirname, "../logs", directory, "error.log"),
          level: "error",
        }),
        new winston.transports.File({
          filename: path.join(__dirname, "../logs", directory, "warn.log"),
          level: "warn",
        }),
        new winston.transports.File({
          filename: path.join(__dirname, "../logs", directory, "http.log"),
          level: "http",
        }),
      ],
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        enumerateErrorFormat(),
        winston.format.printf(
          (info) =>
            `${info.timestamp} ${info.level}: ${info.message} ${
              info.stack ? `\n${info.stack}` : ""
            }`
        )
      ),
      exitOnError: false,
    });

    logger.stream = {
      write: (message, encoding) => {
        logger.http(message);
      },
    };
  }

  return logger;
};
