import { guid } from "./guid";
export var shortGuid = function () { return guid(1).replace('-', ''); };
export var isShortGuid = function (value) {
    if (value.length !== 26)
        return 'Should be 26 characters long';
    if (!alphanumericRegex.test(value))
        return 'Should be only alphanumeric';
    return '';
};
var alphanumericRegex = /^[a-zA-Z0-9]+$/;
//# sourceMappingURL=shortGuid.js.map