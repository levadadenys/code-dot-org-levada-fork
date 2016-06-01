/**
 * @file Decorate a grunt module to track and log durations for all of its
 *       steps, and (when possible) to upload those logs to New Relic.
 */
var newrelic = require('newrelic'); // Wants to be first.
var _ = require('lodash');
var cdoConfig = require('./cdo-config');
var chalk = require('chalk');
var fs = require('fs');
var execSync = require('child_process').execSync;
var path = require('path');
var timeGrunt = require('time-grunt-nowatch');

var LOG_FILE_NAME = 'build-times.log';
var UPLOAD_LOG_FILE_NAME = 'build-times-to-upload.log';
var LOG_FILE_PATH = path.join(__dirname, '../', LOG_FILE_NAME);
var UPLOAD_LOG_FILE_PATH = path.join(__dirname, '../', UPLOAD_LOG_FILE_NAME);

/**
 * Decorate the given grunt module to record and report build durations.
 *
 * @example Gruntfile.js
 *   module.exports = function (grunt) {
 *     logBuildTimes(grunt);
 *     grunt.registerTask(build, function () {...});
 *   };
 */
module.exports = function logBuildTimes(grunt) {
  timeGrunt(grunt, false, function (stats, log) {
    log(chalk.underline('New Relic Logging'));
    writeStatsToLogFile(stats, log);
  });
  return {
    upload: uploadLoggedStatsToNewRelic
  };
};

/**
 * Writes build time statistics generated by time-grunt-nowatch to a log file.
 * @param {object} stats
 * @param {function} consoleLog
 */
function writeStatsToLogFile(stats, consoleLog) {
  try {
    var logLine = JSON.stringify([
      new Date().toString(),
      getUserEmail(),
      stats
    ])+'\n';
    fs.appendFileSync(LOG_FILE_PATH, logLine);
    fs.appendFileSync(UPLOAD_LOG_FILE_PATH, logLine);
    consoleLog('Build statistics added to ' + LOG_FILE_NAME);
  } catch (e) {
    consoleLog(chalk.red("Failed to write to " + LOG_FILE_NAME + " file: " + e));
  }
}

/**
 * Reads the log file and attempts to upload it to New Relic.  If successful,
 * truncates the log file.
 * @param {function} consoleLog - function that accepts strings to log to the console
 * @param {function} [callback] - optional callback to call when finished
 */
function uploadLoggedStatsToNewRelic(consoleLog, callback) {
  if (!isNewRelicConfigured()) {
    // we will skip logging to new relic.
    consoleLog(chalk.yellow(
        "Add new_relic_license_key to your locals.yml file to\n" +
        "have your build times logged to new relic. Talk to paul@code.org\n" +
        "for more information."
    ));
    return;
  }

  try {
    var rawData = fs.readFileSync(UPLOAD_LOG_FILE_PATH, 'utf-8');
    var dataToLog = parseCollectedData(rawData);
  } catch (e) {
    consoleLog(chalk.yellow("Unable to parse " + LOG_FILE_NAME + ". Skipping New Relic upload"));
    return;
  }

  if (dataToLog.length > 0) {
    consoleLog("Sending " + dataToLog.length + " build time events to new relic ");
    var failed = false;
    dataToLog.forEach(function (data) {
      try {
        newrelic.recordCustomEvent("apps_build", data);
      } catch (e) {
        consoleLog(chalk.red("Failed to upload to new relic: "+e));
        failed = true;
      }
    });
    if (!failed) {
      consoleLog("You should see a green OK if this works.");
      newrelic.shutdown({collectPendingData: true}, function (error) {
        if (error) {
          consoleLog(chalk.red('Something went wrong: '+error));
        } else {
          fs.truncateSync(UPLOAD_LOG_FILE_PATH);
          consoleLog(chalk.green('OK'));
        }
        if (callback) {
          callback();
        }
      });
    }
  }
}

/**
 * Given the raw contents of the log file as a string, parses it and returns
 * an array of log entry objects (filtered to 'exec' tasks) ready to upload
 * to New Relic.
 * @param {string} data
 * @returns {{task: string, totalTime: number, email: string, logTimestamp: number}[]}
 */
function parseCollectedData(data) {
  var lines = data.split('\n');
  return lines.reduce(function (collectedData, nextLine) {
    if (!nextLine) {
      return collectedData;
    }
    var data = JSON.parse(nextLine);
    var email = data[1];
    var stats = data[2];
    var timestamp = Math.floor(new Date(data[0]).getTime() / 1000); // seconds since epoch
    var formattedRecords = stats.map(function (stat) {
      return {
        task: stat[0],
        totalTime: stat[1],
        email: email,
        logTimestamp: timestamp
      };
    }).filter(function (data) {
      return /^exec/.test(data.task);
    });
    return collectedData.concat(formattedRecords);
  }, []);
}

/**
 * True if we can find a configured New Relic license key, otherwise false.
 */
function isNewRelicConfigured() {
  return !!cdoConfig.get('new_relic_license_key');
}

/**
 * Retrieve the git user's email address.  Return 'unknown' if we are unable
 * to get this information.
 */
var getUserEmail = _.once(function () {
  try {
    return execSync('git config --get user.email').toString().trim();
  } catch (e) {
    // I guess we are not in a git checkout, or don't have git installed.
    return 'unknown';
  }
});
