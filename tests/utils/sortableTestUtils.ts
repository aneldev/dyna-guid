export type TGuidModule = typeof import("../../src");

export const T = Date.UTC(2026, 9, 2, 12, 0, 0);   // A fixed "now" for the mocked clock

// Fresh module instance, to reset the internal timestamp/sequence state
export const loadModule = async (): Promise<TGuidModule> => {
  jest.resetModules();
  return import("../../src");
};

export const mockClock = (time: number): { set: (time: number) => void; tick: (ms?: number) => void } => {
  let now = time;
  jest.spyOn(Date, "now").mockImplementation(() => now);
  return {
    set: (time: number) => now = time,
    tick: (ms: number = 1) => now += ms,
  };
};

export const sorted = (items: string[]): string[] => items.concat().sort();

export const shuffled = (items: string[]): string[] => {
  const output = items.concat();
  for (let i = output.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
};

export const unique = (items: string[]): number => new Set(items).size;

// Works for guids and short guids
export const body = (guid: string): string => guid.replace(/-/g, "");
export const timestampOf = (guid: string): number => parseInt(body(guid).substring(0, 14), 10);
export const sequenceOf = (guid: string): number => parseInt(body(guid).substring(14, 17), 10);
