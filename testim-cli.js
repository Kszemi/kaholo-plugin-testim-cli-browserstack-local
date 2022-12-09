const decompress = require("decompress");
const fs = require("fs");
const got = require("got");
const { promisify } = require("util");
const stream = require("stream");
const childProcess = require("child_process");
const { spawn } = require(childProcess);
const execFile = promisify(childProcess.execFile);

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

  // const bsApiKey = "eT2JSAzCbcBJMhCXmBUD";
  // const testimLocalId = "test";
  // const testimToken = "YXnKcSWZaYZbyxcWGTdYkdLYSFRApJB5kChGDUQe9t7gkw8HCA";
  // const testimProjectId = "Cd0ZhnHSFIZsX4nwvUIR";
  // const testimGrid = "exercise2";
  // const testName = "bs-local";

  // const bsLocalBinaryUrl = "https://bstack-local-prod.s3.amazonaws.com/binaries/release/v8.8/BrowserStackLocal-linux-ia32.zip";
  // const bsLocalBinaryUrl = "https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-x64.zip";
  const bsLocalBinaryUrl = "https://www.browserstack.com/browserstack-local/BrowserStackLocal-alpine.zip";
  // const bsLocalBinaryUrl = "https://www.browserstack.com/browserstack-local/BrowserStackLocal-linux-ia32.zip"
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

  const { child } = execFile(`./dist/${unzipped[0].path}`, ["--key", bsApiKey, "--force-local", "--local-identifier", testimLocalId]);

  child.stdout.on("data", (data) => {
    console.info(data.toString());
  });
  child.stderr.on("data", (data) => {
    console.info(data.toString());
  });

  console.info("After exec bsLocalBinary");
  // let child;
  // try {
  //   child = childProcess.execFile(
  //     `./dist/${unzipped[0].path}`,
  //     ["--key1", bsApiKey, "--force-local", "--local-identifier", testimLocalId],
  //   );
  // } catch (error) {
  //   console.error(error);
  // }
  //
  // console.info("After bs exec");
  //
  // child.stdout.on("data", (data) => {
  //   console.info(data.toString());
  // });
  //
  // child.stdout.on("data", (data) => {
  //   console.info(data.toString());
  // });

  // npm i -g @testim/testim-cli
  // && testim --token "YXnKcSWZaYZbyxcWGTdYkdLYSFRApJB5kChGDUQe9t7gkw8HCA"
  // --project "Cd0ZhnHSFIZsX4nwvUIR"
  // --grid "exercise2"
  // --name "bs-local"
  // --browserstack-options sample.json

  const commandToExecute = `npm i -g @testim/testim-cli && testim --token ${testimToken} --project ${testimProjectId} --grid ${testimGrid} --name ${testName} --browserstack-options options.json`;

  const { child: spawnChild } = spawn(commandToExecute, {
    shell: true,
  });

  console.info("After testim exec");

  spawnChild.stdout.on("data", (data) => {
    console.info(`stdout: ${data.toString()}`);
  });

  spawnChild.stderr.on("data", (data) => {
    console.info(`stderr: ${data.toString()}`);
  });

  spawnChild.on("exit", (code) => {
    console.info(`child process exited with code ${code.toString()}`);
  });

  setTimeout(() => {
    child.kill("SIGKILL");
    return "DONE";
  }, 120000);
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
    console.error(`Something went wrong when downloading BrowserstackLocal binary:  ${error.message}`);
  }
  return `${process.cwd()}/${fileName}`;
}

module.exports = {
  runTestim,
};

// runTestim({});
