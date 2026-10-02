import {
  TGuidModule,
  T,
  loadModule,
  mockClock,
  sorted,
  shuffled,
  unique,
  timestampOf,
  body,
  sequenceOf,
} from "../utils/sortableTestUtils";

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{18}$/;

describe("dyna guid sortable", () => {
  let guid: TGuidModule["guid"];
  let isGuid: TGuidModule["isGuid"];

  beforeEach(async () => {
    ({
      guid,
      isGuid,
    } = await loadModule());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("schema (backwards compatibility)", () => {
    test("default guid has the 8-8-18 schema with fixed length 36", () => {
      for (let i = 0; i < 1000; i++) {
        const value = guid();
        expect(value).toHaveLength(36);
        expect(value).toMatch(GUID_REGEX);
      }
    });

    test("default guid is validated by isGuid", () => {
      for (let i = 0; i < 1000; i++) expect(isGuid(guid())).toBe(true);
    });

    test("any number of blocks has the correct schema and is validated by isGuid", () => {
      for (let blocks = 0; blocks <= 8; blocks++) {
        const value = guid(blocks);
        const parts = value.split("-");
        expect(value).toHaveLength((blocks * 9) + 18);
        expect(parts).toHaveLength(blocks + 1);
        parts.slice(0, -1).forEach(part => expect(part).toMatch(/^[0-9a-f]{8}$/));
        expect(parts[parts.length - 1]).toMatch(/^[0-9a-f]{18}$/);
        expect(isGuid(value, blocks)).toBe(true);
      }
    });

    test("schema is the same on the same millisecond", () => {
      mockClock(T);
      for (let i = 0; i < 1000; i++) {
        const value = guid();
        expect(value).toMatch(GUID_REGEX);
        expect(isGuid(value)).toBe(true);
      }
    });

    test("schema is the same when the sequence of the millisecond is exhausted", () => {
      mockClock(T);
      let value = "";
      for (let i = 0; i < 70000; i++) value = guid();
      expect(value).toMatch(GUID_REGEX);
      expect(isGuid(value)).toBe(true);
    });

    test("schema is the same for edge random values", () => {
      const random = jest.spyOn(Math, "random");
      [0, 0.000000001, 0.5, 0.9999999999999999].forEach(randomValue => {
        random.mockReturnValue(randomValue);
        const value = guid();
        expect(value).toMatch(GUID_REGEX);
        expect(isGuid(value)).toBe(true);
      });
    });

    test("schema is the same for small and big timestamps", () => {
      const clock = mockClock(1);
      [1, 1000, Date.UTC(1999, 0, 1), T, Date.UTC(2300, 0, 1), Date.UTC(5000, 0, 1)].forEach(time => {
        clock.set(time);
        const value = guid();
        expect(value).toMatch(GUID_REGEX);
        expect(isGuid(value)).toBe(true);
        expect(timestampOf(value)).toBe(time);
      });
    });

    test("guids of the previous versions are still valid", () => {
      // V2
      expect(isGuid("139aca66-2024bc60-2f847b9701be62a163")).toBe(true);
      expect(isGuid("12f5ade5-54356610-2f847b9702f0b91635")).toBe(true);
      expect(isGuid("216f48d8-233eb6b0-2f847b970379de20d6")).toBe(true);
      // V1
      expect(isGuid("1g6263bg-1h2c3a89-18046497750547120")).toBe(true);
    });
  });

  describe("content", () => {
    test("starts with the timestamp and the sequence", () => {
      mockClock(T);
      const value = guid();
      expect(timestampOf(value)).toBe(T);
      expect(sequenceOf(value)).toBe(0);
    });

    test("the timestamp follows the clock", () => {
      const clock = mockClock(T);
      for (let i = 0; i < 100; i++) {
        expect(timestampOf(guid())).toBe(T + (i * 7));
        clock.tick(7);
      }
    });

    test("the rest of the guid is random", () => {
      mockClock(T);
      const tails: string[] = [];
      for (let i = 0; i < 1000; i++) tails.push(body(guid()).substring(17));
      expect(unique(tails)).toBe(1000);
    });

    test("two instances (like 2 processes) create different guids on the same millisecond", async () => {
      mockClock(T);
      const instanceA = await loadModule();
      const instanceB = await loadModule();
      for (let i = 0; i < 1000; i++) {
        const a = instanceA.guid();
        const b = instanceB.guid();
        expect(body(a).substring(0, 17)).toBe(body(b).substring(0, 17));   // Same timestamp and sequence
        expect(a).not.toBe(b);
      }
    });
  });

  describe("sortable on different milliseconds", () => {
    test("guids created on consecutive milliseconds are sorted", () => {
      const clock = mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 5000; i++) {
        guids.push(guid());
        clock.tick();
      }
      expect(sorted(guids)).toEqual(guids);
      expect(unique(guids)).toBe(guids.length);
    });

    test("guids created with random time gaps are sorted", () => {
      const clock = mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 5000; i++) {
        guids.push(guid());
        clock.tick(1 + Math.floor(Math.random() * 100000000));
      }
      expect(sorted(guids)).toEqual(guids);
    });

    test("each guid is greater than the previous one", () => {
      // const clock = mockClock(T);
      let previous = guid();
      for (let i = 0; i < 5000; i++) {
        // clock.tick();
        const current = guid();
        expect(current > previous).toBe(true);
        previous = current;
      }
    });

    test("sorted when the timestamp crosses hex digit boundaries", () => {
      const times = [
        0x1, 0x9, 0xa, 0xf, 0x10, 0xff, 0x100, 0xfff, 0x1000,
        0xffffffff, 0x100000000,
        0xfffffffffff, 0x100000000000,
        99999999999998, 99999999999999,   // The biggest timestamp of the fixed width (year 5138)
      ];
      const clock = mockClock(0);
      const guids = times.map(time => {
        clock.set(time);
        return guid();
      });
      expect(sorted(guids)).toEqual(guids);
    });

    test("sorted when the timestamp crosses decimal digit boundaries", () => {
      const times = [9, 10, 99, 100, 999999999999, 1000000000000, 9999999999999, 10000000000000];    // The last 2: 13 to 14 digits (year 2286)
      const clock = mockClock(0);
      const guids = times.map(time => {
        clock.set(time);
        return guid();
      });
      expect(sorted(guids)).toEqual(guids);
    });

    test("sorted through years", () => {
      const clock = mockClock(0);
      const guids: string[] = [];
      for (let year = 1971; year < 3000; year++) {
        clock.set(Date.UTC(year, 0, 1));
        guids.push(guid());
      }
      expect(sorted(guids)).toEqual(guids);
    });

    test("shuffled guids are sorted back to the creation order", () => {
      const clock = mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 5000; i++) {
        guids.push(guid());
        clock.tick();
      }
      const shuffledGuids = shuffled(guids);
      expect(shuffledGuids).not.toEqual(guids);
      expect(sorted(shuffledGuids)).toEqual(guids);
    });

    test("sortable with any string compare method", () => {
      const clock = mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 2000; i++) {
        guids.push(guid());
        clock.tick(i % 3);    // Mix same and different milliseconds
      }
      const shuffledGuids = shuffled(guids);
      expect(shuffledGuids.concat().sort()).toEqual(guids);
      expect(shuffledGuids.concat().sort((a, b) => a < b ? -1 : a > b ? 1 : 0)).toEqual(guids);
      expect(shuffledGuids.concat().sort((a, b) => a.localeCompare(b))).toEqual(guids);
    });
  });

  describe("sortable on the same millisecond", () => {
    test("guids of the same millisecond are different", () => {
      mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 10000; i++) guids.push(guid());
      expect(unique(guids)).toBe(guids.length);
    });

    test("guids of the same millisecond are sorted", () => {
      mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 10000; i++) guids.push(guid());
      expect(sorted(guids)).toEqual(guids);
    });

    test("each guid of the same millisecond is greater than the previous one", () => {
      mockClock(T);
      let previous = guid();
      for (let i = 0; i < 10000; i++) {
        const current = guid();
        expect(current > previous).toBe(true);
        previous = current;
      }
    });

    test("guids of the same millisecond have the same timestamp and increasing sequence", () => {
      mockClock(T);
      for (let i = 0; i < 1000; i++) {
        const value = guid();
        expect(timestampOf(value)).toBe(T);
        expect(sequenceOf(value)).toBe(i);
      }
    });

    test("the order doesn't depend on the random part", () => {
      mockClock(T);
      // Descending random values, so only the sequence can keep the order
      let randomValue = 0.999;
      jest.spyOn(Math, "random").mockImplementation(() => randomValue -= 0.00001);
      const guids: string[] = [];
      for (let i = 0; i < 1000; i++) guids.push(guid());
      expect(sorted(guids)).toEqual(guids);
    });

    test("sorted and different even with the same random part", () => {
      mockClock(T);
      jest.spyOn(Math, "random").mockReturnValue(0.5);
      const guids: string[] = [];
      for (let i = 0; i < 1000; i++) guids.push(guid());
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
    });

    test("the sequence restarts on the next millisecond", () => {
      const clock = mockClock(T);
      for (let i = 0; i < 100; i++) guid();
      clock.tick();
      const value = guid();
      expect(timestampOf(value)).toBe(T + 1);
      expect(sequenceOf(value)).toBe(0);
    });

    test("bursts on many milliseconds are sorted", () => {
      const clock = mockClock(T);
      const guids: string[] = [];
      for (let ms = 0; ms < 100; ms++) {
        for (let i = 0; i < 500; i++) guids.push(guid());
        clock.tick();
      }
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
      expect(sorted(shuffled(guids))).toEqual(guids);
    });

    test("any number of blocks is sorted on the same millisecond", () => {
      mockClock(T);
      for (let blocks = 0; blocks <= 5; blocks++) {
        const guids: string[] = [];
        for (let i = 0; i < 2000; i++) guids.push(guid(blocks));
        expect(unique(guids)).toBe(guids.length);
        expect(sorted(guids)).toEqual(guids);
      }
    });
  });

  describe("sortable when the sequence of the millisecond is exhausted", () => {
    test("more than 1000 guids on the same millisecond are different and sorted", () => {
      mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 200000; i++) guids.push(guid());
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
    });

    test("the exhausted sequence moves to the next millisecond", () => {
      mockClock(T);
      let value = "";
      for (let i = 0; i < 1000; i++) value = guid();
      expect(timestampOf(value)).toBe(T);
      expect(sequenceOf(value)).toBe(999);

      value = guid();
      expect(timestampOf(value)).toBe(T + 1);
      expect(sequenceOf(value)).toBe(0);
    });

    test("sorted when the clock reaches the borrowed millisecond", () => {
      const clock = mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 1000 + 10; i++) guids.push(guid());    // The last 10 borrowed the T + 1
      clock.tick();
      for (let i = 0; i < 10; i++) guids.push(guid());            // Now the clock is at T + 1
      clock.tick();
      for (let i = 0; i < 10; i++) guids.push(guid());
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
      expect(timestampOf(guids[guids.length - 1])).toBe(T + 2);
    });
  });

  describe("sortable when the clock goes back", () => {
    test("guids are different and sorted when the clock goes back", () => {
      const clock = mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 100; i++) guids.push(guid());
      clock.set(T - 60000);
      for (let i = 0; i < 100; i++) guids.push(guid());
      clock.set(T - 3600000);
      for (let i = 0; i < 100; i++) guids.push(guid());
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
    });

    test("guids are sorted with a jumping clock", () => {
      const clock = mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 5000; i++) {
        guids.push(guid());
        clock.tick(Math.floor(Math.random() * 21) - 10);    // -10ms..+10ms
      }
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
    });

    test("follows the clock again when it passes the last timestamp", () => {
      const clock = mockClock(T);
      guid();
      clock.set(T - 1000);
      expect(timestampOf(guid())).toBe(T);
      clock.set(T + 1000);
      const value = guid();
      expect(timestampOf(value)).toBe(T + 1000);
      expect(sequenceOf(value)).toBe(0);
    });
  });

  describe("sortable between instances (like other processes or imports)", () => {
    test("guids of different instances are sorted when created on different milliseconds", async () => {
      const clock = mockClock(T);
      const instances = [await loadModule(), await loadModule(), await loadModule()];
      const guids: string[] = [];
      for (let i = 0; i < 3000; i++) {
        guids.push(instances[i % 3].guid());
        clock.tick();
      }
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
    });

    test("guids of different instances are sorted by millisecond when created in bursts", async () => {
      const clock = mockClock(T);
      const instances = [await loadModule(), await loadModule(), await loadModule()];
      const guids: string[] = [];
      for (let ms = 0; ms < 100; ms++) {
        instances.forEach(instance => {
          for (let i = 0; i < 100; i++) guids.push(instance.guid());
        });
        clock.tick();
      }
      expect(unique(guids)).toBe(guids.length);
      const timestamps = sorted(shuffled(guids)).map(timestampOf);
      expect(timestamps).toEqual(guids.map(timestampOf));
    });

    test("a new instance continues after the guids of an older instance", async () => {
      const clock = mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 10; i++) {
        const instance = await loadModule();    // Like an application restart
        for (let j = 0; j < 100; j++) guids.push(instance.guid());
        clock.tick();
      }
      expect(sorted(guids)).toEqual(guids);
    });

    test("an instance sorts its guids of the same millisecond, independently of the other instances", async () => {
      mockClock(T);
      const instanceA = await loadModule();
      const instanceB = await loadModule();
      const guidsA: string[] = [];
      const guidsB: string[] = [];
      for (let i = 0; i < 500; i++) {
        guidsA.push(instanceA.guid());
        guidsB.push(instanceB.guid());
      }
      const all = sorted(guidsA.concat(guidsB));
      expect(unique(all)).toBe(1000);
      expect(all.filter(value => guidsA.includes(value))).toEqual(guidsA);
      expect(all.filter(value => guidsB.includes(value))).toEqual(guidsB);
    });
  });

  describe("sortable with the real clock", () => {
    test("100000 guids created in a row are different and sorted", () => {
      const guids: string[] = [];
      for (let i = 0; i < 100000; i++) guids.push(guid());
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
    });

    test("guids created with delays are sorted", async () => {
      const guids: string[] = [];
      for (let i = 0; i < 50; i++) {
        guids.push(guid(), guid(), guid());
        await new Promise(resolve => setTimeout(resolve, i % 4));
      }
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
    });

    test("guids created by concurrent async tasks are sorted in creation order", async () => {
      const guids: string[] = [];
      const task = async (): Promise<void> => {
        for (let i = 0; i < 200; i++) {
          guids.push(guid());
          await Promise.resolve();
          if (i % 50 === 0) await new Promise(resolve => setTimeout(resolve, 1));
        }
      };
      await Promise.all([task(), task(), task(), task(), task()]);
      expect(guids).toHaveLength(1000);
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
    });

    test("the timestamp of the guid is the current time", () => {
      const before = Date.now();
      const value = guid();
      const after = Date.now();
      expect(timestampOf(value)).toBeGreaterThanOrEqual(before);
      expect(timestampOf(value)).toBeLessThanOrEqual(after);
    });
  });
});
