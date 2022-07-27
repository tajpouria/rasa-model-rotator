const chokidar = require("chokidar");
const { throttle } = require("throttle-debounce");
const { readdir, unlinkSync, copyFileSync } = require("fs");
const { join } = require("path");

const TARGET_DIR = process.env.TARGET_DIR || "models",
  LATEST_MODEL_PATH = process.env.LATEST_MODEL_PATH || "models/latest.tar.gz",
  THROTTLE_DELAY_MS = process.env.THROTTLE_DELAY || 5000,
  IGNORE_FILE_PATHS = process.env.IGNORE_FILE_PATHS || "models/lost+found";

const throttleFunc = throttle(
  parseInt(THROTTLE_DELAY_MS, 10),
  (path) => {
    readdir(TARGET_DIR, (err, files) => {
      if (err) {
        console.error(`[Error]: Exception on executing readdir: '${err}'.`);
      }

      console.info(
        `[Info]: Executing copyFileSync '${path}' '${LATEST_MODEL_PATH}'...`
      );
      copyFileSync(path, LATEST_MODEL_PATH);
      console.info(
        `[Info]: Ran copyFileSync '${path}' '${LATEST_MODEL_PATH}'.`
      );

      files.forEach((file) => {
        const fileDir = join(TARGET_DIR, file);
        if (
          ![...IGNORE_FILE_PATHS.split(","), path, LATEST_MODEL_PATH].includes(
            fileDir
          )
        ) {
          console.info(`[Info]: Executing unlinkSync '${fileDir}'...`);
          unlinkSync(fileDir);
          console.info(`[Info]: Ran unlinkSync '${fileDir}'.`);
        }
      });
    });
  },
  { noLeading: false, noTrailing: false }
);

const watcher = chokidar.watch(TARGET_DIR).on("change", (path) => {
  if (path === LATEST_MODEL_PATH) return;
  throttleFunc(path);
});

process.on("SIGTERM", () => {
  console.info("[Info]: SIGTERM signal received.");
  watcher.removeAllListeners();
  process.exit(0);
});

console.info(
  `[Info]: Loaded variables: TARGET_DIR='${TARGET_DIR}', LATEST_MODEL_PATH='${LATEST_MODEL_PATH}', THROTTLE_DELAY='${THROTTLE_DELAY_MS}', IGNORE_FILE_PATHS='${IGNORE_FILE_PATHS}'.`
);
console.info("[Info]: Watching for changes...");
