/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
__webpack_require__(3);
__webpack_require__(2);


/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("babel-polyfill");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

var STRESS_TEST = true;
var ITEM_TIMEOUT_MS = 10;
var NORMAL_ITEMS_COUNT = 20;
var STRESS_ITEMS_COUNT = 200;
var ITEMS_COUNT = STRESS_TEST && STRESS_ITEMS_COUNT || NORMAL_ITEMS_COUNT;
var timeout = (STRESS_TEST && STRESS_ITEMS_COUNT || 1) * ITEM_TIMEOUT_MS;
if (typeof jasmine !== 'undefined')
    jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout;
// help: https://facebook.github.io/jest/docs/expect.html
describe('Internal module test', function () {
    it('should do this', function () {
        expect(true).toBe(true);
    });
});


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// Dev node: Come on!!! this is super ugly...
// If you find a stable way to debug the jest tests please fork me!
// As documented here: https://facebook.github.io/jest/docs/troubleshooting.html is not working as far of May/17
if (typeof global === 'undefined' && typeof window !== 'undefined') global = window;

var HIDE_SUCCESS_VALIDATION = true;

global._mockJest = null;

global.clearTest = function () {
	global._mockJest = {
		errors: 0,
		passed: 0,
		descriptions: []
	};
};
global.clearTest();

global.describe = function (description, cbDefineIts) {
	global._mockJest.descriptions.push({
		description: description,
		its: []
	});

	cbDefineIts();
	startTests();
};

global.describe.skip = function () {
	return undefined;
};

global.it = function (description, cbTest) {
	global._mockJest.descriptions[global._mockJest.descriptions.length - 1].its.push({
		description: description,
		cbTest: cbTest
	});
	startTests();
};

global.it.skip = function () {
	return undefined;
};

global.expect = function (expectValue) {
	return comparisons(expectValue);
};

var comparisons = function comparisons(expectValue) {
	var not = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

	return {
		get not() {
			return comparisons(expectValue, true);
		},
		toBe: function toBe(toBeValue) {
			var result = expectValue === toBeValue;
			if (not) result = !result;
			if (result) {
				if (!HIDE_SUCCESS_VALIDATION) console.log('        Success, === equal value');
				global._mockJest.passed++;
			} else {
				console.log('        FAILED, expected [' + toBeValue + '] but received [' + expectValue + ']');
				global._mockJest.errors++;
			}
		}
	};
};

var startTimer = null;
function startTests() {
	if (startTimer) clearTimeout(startTimer);
	startTimer = setTimeout(executeTests, 100);
}

function executeTests() {
	console.log('### TESTs begin');
	var descriptions = [].concat(global._mockJest.descriptions);

	var processTheNextDescription = function processTheNextDescription() {
		var description = descriptions.shift();
		if (description) {
			executeADescription(description, function () {
				processTheNextDescription();
			});
		} else {
			finished();
		}
	};

	// start
	processTheNextDescription();
}

function executeADescription(description, cbCompleted) {
	console.log('Description::: Start:', description.description);
	var its = [].concat(description.its);

	executeIts(its, function () {
		console.log('Description::: Finished:', description.description);
		cbCompleted();
	});
}

function executeIts(its, cbCompleted) {
	var it = its.shift();
	if (!it) {
		cbCompleted();
		return;
	}

	console.log('    it:::', it.description);
	if (it.cbTest.length === 0) {
		it.cbTest();
		executeIts(its, cbCompleted);
	} else {
		it.cbTest(function () {
			executeIts(its, cbCompleted);
		});
	}
}

function finished() {
	var report = '### All TEST finished, results:' + ' ' + 'errors:' + ' ' + global._mockJest.errors + ' ' + 'passed:' + ' ' + global._mockJest.passed;
	console.log('');
	if (global._mockJest.errors) {
		console.log(' xx   xx ');
		console.log('  xx xx  ');
		console.log('   xxx   ');
		console.log('  xx xx  ');
		console.log(' xx   xx ' + report);
		process.exit(100);
	} else {
		console.log('      vv');
		console.log('     vv');
		console.log('vv  vv');
		console.log(' vvvv');
		console.log('  vv      ' + report);
		process.exit(0);
	}
}

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1);
module.exports = __webpack_require__(0);


/***/ })
/******/ ]);