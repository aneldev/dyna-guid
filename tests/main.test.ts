declare let jasmine: any, describe: any, expect: any, it: any;
jasmine.getEnv().defaultTimeoutInterval = 5000;

import {guid} from '../src';

describe('dyna guid test', () => {

  it('should create a simple guid', () => {
    let myGUID: string = guid();
    expect(myGUID).not.toBe(undefined);
    expect(myGUID).not.toBe(null);
    expect(myGUID.length > 14).toBe(true);
  });

  it('should have correct number of dashes', () => {
    let myGUID: string = guid(7);
    let dashes: number = 0;
    myGUID.split('').forEach((s: string) => s === '-' ? dashes++ : null);
    expect(dashes).toBe(7);
  });

});
