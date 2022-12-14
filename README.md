# Kaholo Testim CLI BrowserstackLocal Plugin
This plugin allows pipelines to use the Testim CLI to run tests on Browserstack locally.

## Prerequisites
The Testim CLI must be installed on the Kaholo Agent(s) to use this plugin. This happens by default. To install the Testim CLI manually and see the resulting output, one can also use the Command Line plugin to run command `npm i -g @testim/testim-cli`. Note that simply putting `@testim/testim-cli` in package.json of the plugin will not work.


## Access and Authentication
Authentication is controlled by means of a Testim CLI Access Token, Testim Project Id and Browserstack Access Key. These can be found at Setting | CLI when logged into the Testim Automate website. For example,

    npm i -g @testim/testim-cli && testim --token "CDbDF05hRsTCI49Y0lCuYbI49Y0lCuYbKPYbKPT3nUhx4klgbNQ" --project "cLaRJlTIXXeCLaRJlQr3" --grid "Testim-Grid"

In this example the Testim CLI Access Token is `CDbDF05hRsTCI49Y0lCuYbI49Y0lCuYbKPYbKPT3nUhx4klgbNQ` and the Testim Project Id is `cLaRJlTIXXeCLaRJlQr3`.

These two parameters are stored in Kaholo Accounts, which is found alongside Plugin Settings, accessed by clicking on the plugin's name in Kaholo's Setting | Plugins page. The Default Grid can also be configured there in Settings.

Browserstack Access Key should be visible on the Browserstack main page, in the dropdown menu called "ACCESS KEY"

## Plugin Installation
For download, installation, upgrade, downgrade and troubleshooting of plugins in general, see [INSTALL.md](./INSTALL.md).

## Method: run Testim on BrowserStackLocal
This method runs Testim test on BrowserStack Local instance.

### Parameter: BrowserStack Local Identifier
Optional paramter for defining local id of BrowserStackLocal instance.

### Parameter: bsBinaryUrl
Required paramter, where you can overwrite default value with the download URL for BrowserStackLocal binary. (Must be suitable for Linus Alpine);

### Parameter: Testim Grid 
This is the name of the Testim Grid the command should work with. It will be included in the command for you with the `--grid` switch.

### Parameter: Testim test name
Name of the Testim test to run.

### Parameter: Path to BrowserStackOptions
This is passed to Testim CLI command, that starts tests execution. 
See more: https://www.browserstack.com/docs/automate/cypress/cypress-capabilities

### Parameter: Install Latest Testim CLI
If checked, the latest Testim CLI will be installed before running the command. If already installed, unchecking this option may speed up the execution by a few seconds.
