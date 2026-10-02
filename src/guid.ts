const BLOCK_SIZE = 8;
const LAST_BLOCK_SIZE = 18;
const TIMESTAMP_SIZE = 14;    // Digits of the timestamp in ms, fixed width, enough for dates far beyond the year 2300
const SEQUENCE_SIZE = 3;      // Digits, 1000 sortable guids per millisecond
const MAX_SEQUENCE = 999;

let lastTimestamp = 0;
let sequence = 0;

// The guid is the string <timestamp><sequence><random...> (without splitters), split in blocks to meet the format.
// Since the timestamp and the sequence are at the beginning with fixed size, the guids are sortable as plain strings.
export const guid = (randomBlocks: number = 2): string => {
  const now = Date.now();
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

  const bodySize = (randomBlocks * BLOCK_SIZE) + LAST_BLOCK_SIZE;
  let body = pad(String(lastTimestamp), TIMESTAMP_SIZE) + pad(String(sequence), SEQUENCE_SIZE);
  while (body.length < bodySize) body += randomBlock();

  let output = "";
  for (let i = 0; i < randomBlocks; i++) output += body.substring(i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE) + "-";
  output += body.substring(randomBlocks * BLOCK_SIZE, bodySize);

  return output;
};

const pad = (value: string, size: number): string => {
  while (value.length < size) value = "0" + value;
  return value;
};

const randomBlock = (): string => {
  return pad(Math.floor(Math.random() * 0x100000000).toString(16), BLOCK_SIZE);
};

export const isGuid = (guid: string, blocks = 2): string | true => {
  const parts = guid.split("-");
  const isV1 = isNumber(parts[parts.length - 1]);

  if (parts.length - 1 !== blocks) return "Invalid guid, invalid number of blocks";
  const correctRandomBlocks =
    parts
      .concat()
      .slice(0, -1)
      .reduce((acc: boolean, block) => {
        return acc && block.length === 8 && !block.includes(" ");
      }, true);
  if (!correctRandomBlocks) return "Invalid guid, one or more random blocks are invalid";
  if (!isV1 && parts[parts.length - 1].length !== 18) return "Invalid guid, last date block has invalid size";
  return true;
};

const isNumber = (n: any): boolean => {
  return !isNaN(parseFloat(n)) && isFinite(n);
};
