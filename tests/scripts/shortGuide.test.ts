import {
  shortGuid,
  isShortGuid,
} from '../../src'; // Adjust the import path as necessary

describe('ShortGUID Functions', () => {
  test('sguid generates a string of length 26', () => {
    const guid = shortGuid();
    expect(guid.length).toBe(26);
  });

  test('isShortGuid returns an empty string for valid ShortGUID', () => {
    const validShortGuid = shortGuid();
    expect(isShortGuid(validShortGuid)).toBe('');
  });

  test('isShortGuid returns error message for invalid length', () => {
    const invalidLengthGuid = '1234567890123456789012345'; // 25 characters
    expect(isShortGuid(invalidLengthGuid)).toBe('Should be 26 characters long');
  });

  test('isShortGuid returns error message for non-alphanumeric characters', () => {
    const invalidCharGuid = '1234567890123456789012345!';
    expect(isShortGuid(invalidCharGuid)).toBe('Should be only alphanumeric');
  });
});
