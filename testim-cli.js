const decompress = require("decompress");
const fs = require("fs");
const got = require("got");
const { promisify } = require("util");
const stream = require("stream");
const childProcess = require("child_process");

const exec = promisify(childProcess.exec);
const pipeline = promisify(stream.pipeline);

async function runTestim(params) {
  const {
    bsApiKey,
    bsBinaryUrl,
    localId,
    testimToken,
    testimProjectId,
    testimGrid,
    testName,
    bsOptionsFile,
    shouldInstallTestimCLI,
  } = params;

  const fileName = "BrowserStackLocal.zip";

  await downloadBrowserStackBinary(bsBinaryUrl, fileName);

  const unzipped = await unzip(fileName);

  const execOutput = {};
  let bsAbortController;

  try {
    bsAbortController = runBrowserStackLocal(unzipped, bsApiKey, localId);

    if (shouldInstallTestimCLI) {
      await installTestim();
    }

    const execTestimCmd = createTestimExecCmd(
      testimToken,
      testimProjectId,
      testimGrid,
      testName,
      bsOptionsFile,
    );

    let execTestimStdOut;
    let execTestimStdErr;

    try {
      ({ stdout: execTestimStdOut, stderr: execTestimStdErr } = await exec(execTestimCmd));
      execOutput.stdout = execTestimStdOut;
      execOutput.stderr = execTestimStdErr;
    } catch (error) {
      // unfortunately testim returns proper information about failed tests in error
      execOutput.stdout = handleTestimResponse(error, execOutput);
    }
  } finally {
    console.info("Stopping BrowserStackLocal process.");
    if (bsAbortController) {
      try {
        bsAbortController.abort();
      } catch (e) {
        console.error("Could not stop BrowserStackLocal process: ", e);
      }
    }
  }

  return execOutput;
}

async function downloadBrowserStackBinary(bsLocalBinaryUrl, fileName) {
  const downloadStream = got.stream(bsLocalBinaryUrl);
  const fileWriterStream = fs.createWriteStream(fileName);

  let lastProgressPercentage = -10;
  downloadStream.on("BrowserStackLocal downloadProgress", ({ transferred, total, percent }) => {
    const percentage = Math.round(percent * 100);
    if (lastProgressPercentage + 9 < percentage) {
      console.info(`progress: ${transferred}/${total} (${percentage}%)`);
      lastProgressPercentage = percentage;
    }
  });

  try {
    await pipeline(downloadStream, fileWriterStream);
    console.info(`BrowserstackLocal downloaded to ${fileName}`);
  } catch (error) {
    throw new Error(`Something went wrong when downloading BrowserstackLocal binary:  ${error.message}`);
  }
  return `${process.cwd()}/${fileName}`;
}

async function unzip(fileName) {
  return (async () => {
    let decompressed;
    try {
      decompressed = await decompress(fileName, "dist");
    } catch (e) {
      throw new Error(`Error during unpacking ${fileName}: ${e}`);
    }
    return decompressed;
  })();
}

function runBrowserStackLocal(unzipped, bsApiKey, localId) {
  const controller = new AbortController();
  const { signal } = controller;
  const child = childProcess.execFile(`./dist/${unzipped[0].path}`, ["--key", bsApiKey, "--force-local", "--local-identifier", localId], { signal });

  child.stdout.on("data", (data) => {
    console.info(data.toString());
  });
  child.stderr.on("data", (data) => {
    console.info(data.toString());
  });
  return controller;
}

async function installTestim() {
  const instlTestimCmd = "npm i -g @testim/testim-cli";

  try {
    await exec(instlTestimCmd);
  } catch (e) {
    throw new Error(`Error during testim/cli installation: ${e}`);
  }
}

function createTestimExecCmd(testimToken, testimProjectId, testimGrid, testName, bsOptionsFile) {
  return `testim --token ${testimToken} --project ${testimProjectId} --grid ${testimGrid} --name ${testName} --browserstack-options ${bsOptionsFile}`;
}

function handleTestimResponse(error) {
  if (!error?.stdout.includes("Error:")) {
    return error.stdout;
  }

  if (error?.stdout.includes("Error:")) {
    const { stdout: errorOut, stderr: errorErr } = error;
    throw new Error(`Error during testim command execution:\n ${JSON.stringify({ stdout: errorOut, stderr: errorErr })}`);
  } else {
    // error is not passed here as it may contain secrets (like testim token)
    throw new Error("Error during testim command execution");
  }
}

module.exports = {
  runTestim,
};
