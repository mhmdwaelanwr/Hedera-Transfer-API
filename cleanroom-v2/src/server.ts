import { app } from "./app.js";
import { config } from "./config.js";

const server = app.listen(config.PORT, () => {
  console.log(`Hedera Transfer Service v2 listening on :${config.PORT} (testnet)`);
});

function shutdown(signal: string) {
  console.log(`${signal} received; shutting down`);
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
