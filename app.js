const { bootstrap } = require("@kaholo/plugin-library");
const { runTestim } = require("./testim-cli");

module.exports = bootstrap({
  runTestim,
});
