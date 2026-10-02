"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGuid = exports.guid = void 0;
var BLOCK_SIZE = 8;
var LAST_BLOCK_SIZE = 18;
var TIMESTAMP_SIZE = 14; // Digits of the timestamp in ms, fixed width, enough for dates far beyond the year 2300
var SEQUENCE_SIZE = 3; // Digits, 1000 sortable guids per millisecond
var MAX_SEQUENCE = 999;
var lastTimestamp = 0;
var sequence = 0;
// The guid is the string <timestamp><sequence><random...> (without splitters), split in blocks to meet the format.
// Since the timestamp and the sequence are at the beginning with fixed size, the guids are sortable as plain strings.
var guid = function (randomBlocks) {
    if (randomBlocks === void 0) { randomBlocks = 2; }
    var now = Date.now();
    if (now > lastTimestamp) {
        lastTimestamp = now;
        sequence = 0;
    }
    else if (sequence < MAX_SEQUENCE) {
        // Same millisecond (or the clock went back), the sequence keeps the order
        sequence++;
    }
    else {
        // Sequence exhausted for this millisecond, borrow the next one
        lastTimestamp++;
        sequence = 0;
    }
    var bodySize = (randomBlocks * BLOCK_SIZE) + LAST_BLOCK_SIZE;
    var body = pad(String(lastTimestamp), TIMESTAMP_SIZE) + pad(String(sequence), SEQUENCE_SIZE);
    while (body.length < bodySize)
        body += randomBlock();
    var output = "";
    for (var i = 0; i < randomBlocks; i++)
        output += body.substring(i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE) + "-";
    output += body.substring(randomBlocks * BLOCK_SIZE, bodySize);
    return output;
};
exports.guid = guid;
var pad = function (value, size) {
    while (value.length < size)
        value = "0" + value;
    return value;
};
var randomBlock = function () {
    return pad(Math.floor(Math.random() * 0x100000000).toString(16), BLOCK_SIZE);
};
var isGuid = function (guid, blocks) {
    if (blocks === void 0) { blocks = 2; }
    var parts = guid.split("-");
    var isV1 = isNumber(parts[parts.length - 1]);
    if (parts.length - 1 !== blocks)
        return "Invalid guid, invalid number of blocks";
    var correctRandomBlocks = parts
        .concat()
        .slice(0, -1)
        .reduce(function (acc, block) {
        return acc && block.length === 8 && !block.includes(" ");
    }, true);
    if (!correctRandomBlocks)
        return "Invalid guid, one or more random blocks are invalid";
    if (!isV1 && parts[parts.length - 1].length !== 18)
        return "Invalid guid, last date block has invalid size";
    return true;
};
exports.isGuid = isGuid;
var isNumber = function (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
};
//# sourceMappingURL=guid.js.map