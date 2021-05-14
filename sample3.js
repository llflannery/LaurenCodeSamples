const axios = require("axios");
const fs = require("fs").promises;

let reportCache = {};

const endpoint = "https://api.ap.org/v2/reports";
const baseParams = {
  apiKey: process.env.AP_API_KEY,
  format: "json",
};



/**
 * Get the Estimated Vote Percentage reports from AP, link https://api.ap.org/v2/reports?apikey=ErEXhcCcpuKoR1yRb44KY9AQOMbeYdUP&type=EstimatedVotePercentage//
 *
 * @returns {Promise<{}>}
 */

const dayOfElection = "2020-11-03";   // MUST SET THIS FOR GETVOTES TO RECIEVE RIGHT RACE

const getVotes = async function() {
  const normalize = {
    EstimatedVotePercentage: processVoterPercentReport
    // Sumtable: processSumReport
  }

  return retrieveAndFormatResults(endpoint, { test: "false", type: "EstimatedVotePercentage"}, normalize)
};

/**
 * Get the pres reports from AP
 *
 * @returns {Promise<{}>}
 */
const getPres = async function() {
  const normalize = {
    PresStateByStatetable: processSuperReport,
    Sumtable: processSumReport
  }

  return retrieveAndFormatResults(endpoint, { test: "false", type: "pres", geo: "US" }, normalize)
};

/**
 * Get the Nat. House and Senate trend reports from AP
 *
 * @returns {Promise<{}>}
 */
const getTrends = async function() {
  const normalize = {
    trendtable: processNationalTrendReport,
    data: processStateTrendReports
  }

  return retrieveAndFormatResults(endpoint,{ test: "false", type: "trend", geo: "US" }, normalize)
};

/**
 * Retrieve the results from the API and format what we get
 *
 * @param {string} endpoint The URL for the API we want to access
 * @param {object} apUrlParams keys/values that we can later convert into URL parameters when querying the API
 *                             If you pass the property "test" with the value of "true", you will get report with
 *                             test data
 * @param {object} normalize The property names of this object match the element names in the API response. While
 *                           processing the results, when we come across an element with a certain name, we then call
 *                           the function name that is called as a value
 * @returns {Promise<{}>}
 */
const retrieveAndFormatResults = async function(endpoint, apUrlParams, normalize) {
  console.log(`Getting ${apUrlParams.type} report lookup files...`);

  // Retrieve the report lookup files. These contain the links we need to request more granual reports that contain the
  const links = await getAPIData(endpoint, apUrlParams);

  console.log(`Getting ${apUrlParams.type} reports...`);
  let latest = parseLinks(links);


  return getDataFromLinkedReports(latest, normalize);
}

/**
 * Get data from an Associated Press API at the given URL
 * We are using axios to make the requests for us: https://github.com/axios/axios
 *
 * @param {string} url
 * @param {object} params Axios will convert the property/values in this object into URL parameters for the URL it uses
 *                        for its GET request. The URL parameters you need will differ depending on which AP API you
 *                        are querying. Check out their documentation for what URL parameters you need to send
 * @returns {object} the data we retrieved from the API
 */
const getAPIData = async function(url, params = {}) {
  // Send a GET request to the URL: https://github.com/axios/axios#axiosconfig
  const response = await axios({
    url,
    params: Object.assign({}, baseParams, params)
  });
  return response.data;
};


/**
 * Extract the links and a timestamp for when they were last updated
 *
 * @param {object} linkData
 * @returns {object}
 */
const parseLinks = function(linkData) {
  let latest = {};
  linkData.reports.forEach(function(link) {
    const updated = Date.parse(link.updated);
    let [type, name] = link.title.split(/\s*\/\s*/g);
    name = name.replace("del", "");
    const url = link.id;

    if ((type === "EstimatedVotePercentage") && (link.electionDate != dayOfElection)) {
      // Don't pass EVPs that have an election date other than what we want
    } else {
      // Otherwise, Check to see if the updated stamp is the latest available, and pass URL to latest object
      if (latest[name]) {
        if (latest[name].updated > updated) return;
      }

      latest[name] = { updated, url };
    }






  });

  return latest;
}


/**
 * Get the data from the reports linked in a parent report
 *
 * We query a first report from AP that will give us a series of links to follow to get more data. This function process
 * the data in these secondary reports
 *
 * @param {object} latest    URLs and timestamps for when they were updated for each linked report we want to query
 * @param {object} normalize The property names of this object match the element names in the API response. While
 *                           processing the results, when we come across an element with a certain name, we then call
 *                           the function name that is called as a value *
 * @param {object} params keys/values that we will later convert into URL parameters when querying the API
 * @returns {Promise<{}>}
 */
const getDataFromLinkedReports = async function(latest, normalize, params = {}) {
  let output = {};
  const reports = Object.keys(latest).map(async function(name) {
    const link = latest[name];
    const { url } = link;
    let report;

    if (reportCache[url]) {
      console.log(`Getting report from cache (${url})`);
      report = reportCache[url];
    } else {
      console.log(`Loading report from AP (${url})`);
      report = reportCache[url] = await getAPIData(url, params)
    }
    for (var k in report) {
      const prop = k.replace(/del/, "").toLowerCase();
      const processed = normalize[k](report);

      if(prop === 'data') {
        /* The trend report that includes results for each state has a top-level '<data> element that contains the
           state results. When we convert that to JSON, we want that top-level property to be "states" */
        output['states'] = processed;
      } else if (prop == 'trendtable' && processed.office) {
        /* Create a 'national' property to contain the national trend report. This will help us separate the results
           into a multiple files--one file for state results, and another file for national results.
         */
        output['national'] = output['national'] || {};
        const propName = processed.office.replace(/\.|\s+/g,'').toLowerCase(); //remove periods and spaces
        output['national'][propName] = processed;
      } else {
        output[prop] = processed;
      }
    }
  });
  await Promise.all(reports);

  return output;
}

var processSuperReport = function(report) {
  var data = report.PresStateByStatetable.State;
  var out = {
    updated: Date.parse(report.PresStateByStatetable.timestamp),
    allStates: {}
  }

  var normalizeState = function(state) {
    var data = {
      candidates: state.Cand ? state.Cand.map(function(c) {
        return {
          name: c.name,
          id: c.CandID,
          party: c.party,
          votes: c.PopVote,
          percent: c.PopPct,
          electoralVotes: c.ElectWon * 1,
          winner: c.Winner
        }
      }) : []
    }
    return data;
  }

  data.forEach(function(d) {
    var party = d.PostalCode;
    var electTotal = d.ElectTotal;

    out.allStates[party] = {
      // needed, votes,
      electoralTotal: d.ElectTotal,
      prec_per: d.PrecinctsPct,
      allCandidates: normalizeState(d)
    }
  });

  return out;
};

var votesOut = {
  allStates: {}
};


const processVoterPercentReport = function(report) {
  var data = report.EstimatedVotePercentage;

    votesOut.updated = Date.parse(data.timestamp);

      votesOut.allStates[data.State.StatePostal] = {
          electionDay: data.State.ElectionDate,
          stateRaces: data.State.Race
      };

  return votesOut;
};

/**
 * Process the trend report so we can later write it to a file as JSON
 *
 * @param {Object} report
 * @returns {{insufficientVote: *, allParties: {}, office: *, updated: number}}
 */
const processNationalTrendReport = function(report) {
  const data = report.trendtable;
  let out = {
    updated: Date.parse(data.timestamp),
    office: data.office,
    allParties: {},
    insufficientVote: data.InsufficientVote
  }

  data.party.forEach( partyData => {
    out.allParties[partyData.title] = {
      trend: partyData.trend,
      netChange: partyData.NetChange.trend
    }
  });

  return out;
};

/**
 * Process the state-level trend report
 *
 * @param {object} report
 * @returns {array} An array of objects that contain data for each race in a state
 *
 * Example of what is in each array element:
 *  {
 *    state: 'WA',
 *    office: 'State Senate',
 *    MajorityThreshold: '49',
 *    OfficeTypeCode: 'S',
 *    Test: '1',
 *    timestamp: '2020-10-12T05:17:11Z',
 *    party: [ [Object], [Object], [Object] ]
 *  }
 */
const processStateTrendReports = function(report) {
  return report.data.trendtable;
}


var processSumReport = function(report) {
  var out = {
    updated: Date.parse(report.Sumtable.timestamp),
    prec_per: report.Sumtable.PrecinctsPct,
    office: report.Sumtable.office,
    parties: {}
  }

  report.Sumtable.Cand.forEach(function(d) {
    var party = d.name;

    out.parties[party] = {
      // candidates: d.Cand ? d.Cand.map(function(c) {
      // return {
      id: d.CandID,
      party: d.party,
      votes: d.PopVote,
      percent: d.PopPct,
      electoralVotes: d.ElectWon * 1,
      winner: d.Winner
    }
  });

  return out;
};

var processStateReport = function(report) {
  var out = {
    updated: Date.parse(report.delState.timestamp),
    parties: {}
  };

  report.delState.del.forEach(function(d) {
    var party = d.pId;
    var needed = d.dNeed;
    var votes = d.dVotes;

    out.parties[party] = {
      needed, votes,
      states: d.State.map(function(s) {
        return {
          state: s.sId,
          candidates: s.Cand ? s.Cand.map(function(c) {
            return {
              name: c.cName,
              id: c.cId,
              total: c.dTot * 1,
              day: c.d1 * 1
            }
          }) : []
        }
      })
    }
  });

  return out;
};

module.exports = { getPres, getTrends, getVotes }



/// included from the parent file where the module is used: 

var delegateReport = await api.getPres();
        var delegateReportJSON = serialize(delegateReport);
        grunt.file.write("data/delegates.json", delegateReportJSON);
