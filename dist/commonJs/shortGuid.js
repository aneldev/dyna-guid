"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isShortGuid = exports.shortGuid = void 0;
var guid_1 = require("./guid");
var shortGuid = function () { return (0, guid_1.guid)(1).replace('-', ''); };
exports.shortGuid = shortGuid;
var isShortGuid = function (value) {
    if (value.length !== 26)
        return 'Should be 26 characters long';
    if (!alphanumericRegex.test(value))
        return 'Should be only alphanumeric';
    return '';
};
exports.isShortGuid = isShortGuid;
var alphanumericRegex = /^[a-zA-Z0-9]+$/;
//# sourceMappingURL=shortGuid.js.map