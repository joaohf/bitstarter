#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var util = require('util');
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://lit-ravine-1961.herokuapp.com";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var parseChecks = function(obj, checks) {
    var out = {};
    for(var ii in checks) {
        var present = obj(checks[ii]).length > 0;
        out[checks[ii]] = present;        
    }    
    return out;
}

var checkHtmlFile = function(htmlfile, checksfile, showfn) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    showfn(parseChecks($,checks));
};

var checkHtml = function(html, checksfile, showfn) {
    $ = cheerio.load(html);
    var checks = loadChecks(checksfile).sort();
    return parseChecks($,checks);  
}

var buildfn = function(checksfile, showfn) {
  var response2console = function(result, response) {
    var out = '';
    if (result instanceof Error) {
      console.error('Error' + util.format(response.message));      
    } else {
      out = checkHtml(result, checksfile);
    }    
    showfn(out);
  };
  return response2console;
}

var checkUrl = function(url, checksfile, showfn) {
  var response2console = buildfn(checksfile, showfn);
  rest.get(url).on('complete', response2console);
}

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var showfn = function (checkJson) {
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
}

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file [html_file]', 'Path to index.html', clone(assertFileExists))
        .option('-u, --url [url]', 'Url', 'String', URL_DEFAULT)
        .parse(process.argv);

    var checkJson = null;


    if (program.file) {
      checkJson = checkHtmlFile(program.file, program.checks, showfn);
    } else {      
      checkJson = checkUrl(program.url, program.checks, showfn);      
    }        
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
