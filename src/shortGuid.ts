import {guid} from "./guid";

export const shortGuid = (): string => guid(1).replace('-', '');

export const isShortGuid = (value: string): string => {
  if (value.length !== 26) return 'Should be 26 characters long';
  if (!alphanumericRegex.test(value)) return 'Should be only alphanumeric';
  return '';
};

const alphanumericRegex = /^[a-zA-Z0-9]+$/;
