const decompress = require("decompress");
const fs = require("fs");
const got = require("got");
const { promisify } = require("util");
const stream = require("stream");
const childProcess = require("child_process");

const pipeline = promisify(stream.pipeline);

async function runTestim(params) {
  console.info("STARTING METHOD");
  const {
    bsApiKey,
    bsBinaryUrl,
    testimLocalId,
    testimToken,
    testimProjectId,
    testimGrid,
    testName,
    bsOptions,
  } = params;

  const bsLocalBinaryUrl = "https://bstack-local-prod.s3.amazonaws.com/binaries/release/v8.8/BrowserStackLocal-linux-ia32.zip";
  // const bsLocalBinaryUrl = "https://www.browserstack.com/browserstack-local/BrowserStackLocal-darwin-x64.zip";

  const fileName = "BrowserStackLocal.zip";

  const file = await downloadBrowserStackBinary(bsLocalBinaryUrl, fileName);
  console.info("Downloaded file path: ", file);

  const unzipped = await (async () => {
    let decompressed;
    try {
      decompressed = await decompress(fileName, "dist");
    } catch (e) {
      console.error(e);
    }
    return decompressed;
  })();

  console.info("unzipped", unzipped);

  let child;
  try {
    child = childProcess.execFile(
      `./dist/${unzipped[0].path}`,
      ["--key", bsApiKey, "--force-local", "--local-identifier", testimLocalId],
    );
  } catch (error) {
    console.error(error);
  }

  console.info("Child ========= ", child);

  child.stdout.on("data", (data) => {
    console.info(data.toString());
  });

  // npm i -g @testim/testim-cli
  // && testim --token "YXnKcSWZaYZbyxcWGTdYkdLYSFRApJB5kChGDUQe9t7gkw8HCA"
  // --project "Cd0ZhnHSFIZsX4nwvUIR"
  // --grid "exercise2"
  // --name "bs-local"
  // --browserstack-options sample.json

  const commandToExecute = `npm i -g @testim/testim-cli && testim --token ${testimToken} --project ${testimProjectId} --grid ${testimGrid} --name ${testName} --browserstack-options options.json`;

  const spawnResult = await childProcess.spawn(commandToExecute, {
    shell: true,
  });

  spawnResult.stdout.on("data", (data) => {
    console.info(`stdout: ${data.toString()}`);
  });

  spawnResult.stderr.on("data", (data) => {
    console.info(`stderr: ${data.toString()}`);
  });

  spawnResult.on("exit", (code) => {
    console.info(`child process exited with code ${code.toString()}`);
  });

  setTimeout(() => {
    child.kill("SIGKILL");
  }, 360000);
}

async function downloadBrowserStackBinary(bsLocalBinaryUrl, fileName) {
  const downloadStream = got.stream(bsLocalBinaryUrl);
  const fileWriterStream = fs.createWriteStream(fileName);

  let lastProgressPercentage = -10;
  downloadStream.on("downloadProgress", ({ transferred, total, percent }) => {
    const percentage = Math.round(percent * 100);
    if (lastProgressPercentage + 9 < percentage) {
      console.info(`progress: ${transferred}/${total} (${percentage}%)`);
      lastProgressPercentage = percentage;
    }
  });

  try {
    await pipeline(downloadStream, fileWriterStream);
    console.info(`File downloaded to ${fileName}`);
  } catch (error) {
    console.error(`Something went wrong. ${error.message}`);
  }
  return `${process.cwd()}/${fileName}`;
}

module.exports = {
  runTestim,
};
