import {
  TGuidModule,
  T,
  loadModule,
  mockClock,
  sorted,
  shuffled,
  unique,
  timestampOf,
  sequenceOf,
} from '../utils/sortableTestUtils';

const SHORT_GUID_REGEX = /^[0-9a-f]{26}$/;

describe('ShortGUID sortable', () => {
  let guid: TGuidModule['guid'];
  let shortGuid: TGuidModule['shortGuid'];
  let isShortGuid: TGuidModule['isShortGuid'];

  beforeEach(async () => {
    ({
      guid,
      shortGuid,
      isShortGuid,
    } = await loadModule());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('schema (backwards compatibility)', () => {
    test('is 26 alphanumeric characters without hyphen', () => {
      for (let i = 0; i < 1000; i++) {
        const value = shortGuid();
        expect(value).toHaveLength(26);
        expect(value).toMatch(SHORT_GUID_REGEX);
      }
    });

    test('is validated by isShortGuid', () => {
      for (let i = 0; i < 1000; i++) expect(isShortGuid(shortGuid())).toBe('');
    });

    test('schema is the same on the same millisecond', () => {
      mockClock(T);
      for (let i = 0; i < 1000; i++) {
        const value = shortGuid();
        expect(value).toMatch(SHORT_GUID_REGEX);
        expect(isShortGuid(value)).toBe('');
      }
    });

    test('schema is the same when the sequence of the millisecond is exhausted', () => {
      mockClock(T);
      let value = '';
      for (let i = 0; i < 70000; i++) value = shortGuid();
      expect(value).toMatch(SHORT_GUID_REGEX);
      expect(isShortGuid(value)).toBe('');
    });

    test('schema is the same for edge random values', () => {
      const random = jest.spyOn(Math, 'random');
      [0, 0.000000001, 0.5, 0.9999999999999999].forEach(randomValue => {
        random.mockReturnValue(randomValue);
        const value = shortGuid();
        expect(value).toMatch(SHORT_GUID_REGEX);
        expect(isShortGuid(value)).toBe('');
      });
    });

    test('schema is the same for small and big timestamps', () => {
      const clock = mockClock(1);
      [1, 1000, Date.UTC(1999, 0, 1), T, Date.UTC(2300, 0, 1), Date.UTC(5000, 0, 1)].forEach(time => {
        clock.set(time);
        const value = shortGuid();
        expect(value).toMatch(SHORT_GUID_REGEX);
        expect(isShortGuid(value)).toBe('');
        expect(timestampOf(value)).toBe(time);
      });
    });

    test('short guids of the previous version are still valid', () => {
      expect(isShortGuid('2024bc602f847b9701be62a163')).toBe('');
      expect(isShortGuid('543566102f847b9702f0b91635')).toBe('');
      expect(isShortGuid('233eb6b02f847b970379de20d6')).toBe('');
    });
  });

  describe('content', () => {
    test('starts with the timestamp and the sequence', () => {
      mockClock(T);
      const value = shortGuid();
      expect(timestampOf(value)).toBe(T);
      expect(sequenceOf(value)).toBe(0);
    });

    test('the rest of the short guid is random', () => {
      mockClock(T);
      const tails: string[] = [];
      for (let i = 0; i < 1000; i++) tails.push(shortGuid().substring(17));
      expect(unique(tails)).toBe(1000);
    });

    test('two instances (like 2 processes) create different short guids on the same millisecond', async () => {
      mockClock(T);
      const instanceA = await loadModule();
      const instanceB = await loadModule();
      for (let i = 0; i < 1000; i++) {
        const a = instanceA.shortGuid();
        const b = instanceB.shortGuid();
        expect(a.substring(0, 17)).toBe(b.substring(0, 17));   // Same timestamp and sequence
        expect(a).not.toBe(b);
      }
    });
  });

  describe('sortable on different milliseconds', () => {
    test('short guids created on consecutive milliseconds are sorted', () => {
      const clock = mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 5000; i++) {
        guids.push(shortGuid());
        clock.tick();
      }
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
    });

    test('each short guid is greater than the previous one', () => {
      const clock = mockClock(T);
      let previous = shortGuid();
      for (let i = 0; i < 5000; i++) {
        clock.tick();
        const current = shortGuid();
        expect(current > previous).toBe(true);
        previous = current;
      }
    });

    test('sorted when the timestamp crosses digit boundaries', () => {
      const times = [
        0x1, 0x9, 0xa, 0xf, 0x10, 0xff, 0x100, 999, 1000,
        0xffffffff, 0x100000000,
        999999999999, 1000000000000,
        0xfffffffffff, 0x100000000000,
        99999999999998, 99999999999999,   // The biggest timestamp of the fixed width (year 5138)
      ];
      const clock = mockClock(0);
      const guids = times.map(time => {
        clock.set(time);
        return shortGuid();
      });
      expect(sorted(guids)).toEqual(guids);
    });

    test('shuffled short guids are sorted back to the creation order', () => {
      const clock = mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 5000; i++) {
        guids.push(shortGuid());
        clock.tick(i % 3);    // Mix same and different milliseconds
      }
      const shuffledGuids = shuffled(guids);
      expect(shuffledGuids).not.toEqual(guids);
      expect(shuffledGuids.concat().sort()).toEqual(guids);
      expect(shuffledGuids.concat().sort((a, b) => a < b ? -1 : a > b ? 1 : 0)).toEqual(guids);
      expect(shuffledGuids.concat().sort((a, b) => a.localeCompare(b))).toEqual(guids);
    });
  });

  describe('sortable on the same millisecond', () => {
    test('short guids of the same millisecond are different and sorted', () => {
      mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 10000; i++) guids.push(shortGuid());
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
    });

    test('short guids of the same millisecond have the same timestamp and increasing sequence', () => {
      mockClock(T);
      for (let i = 0; i < 1000; i++) {
        const value = shortGuid();
        expect(timestampOf(value)).toBe(T);
        expect(sequenceOf(value)).toBe(i);
      }
    });

    test('sorted and different even with the same random part', () => {
      mockClock(T);
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const guids: string[] = [];
      for (let i = 0; i < 1000; i++) guids.push(shortGuid());
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
    });

    test('the sequence restarts on the next millisecond', () => {
      const clock = mockClock(T);
      for (let i = 0; i < 100; i++) shortGuid();
      clock.tick();
      const value = shortGuid();
      expect(timestampOf(value)).toBe(T + 1);
      expect(sequenceOf(value)).toBe(0);
    });

    test('more than 1000 short guids on the same millisecond are different and sorted', () => {
      mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 200000; i++) guids.push(shortGuid());
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
      expect(timestampOf(guids[999])).toBe(T);
      expect(timestampOf(guids[1000])).toBe(T + 1);
    });

    test('sorted when the clock goes back', () => {
      const clock = mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 5000; i++) {
        guids.push(shortGuid());
        clock.tick(Math.floor(Math.random() * 21) - 10);    // -10ms..+10ms
      }
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
    });
  });

  describe('mixed with guid()', () => {
    test('is the guid(1) without the hyphen', () => {
      mockClock(T);
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const short = shortGuid();
      const long = guid(1);
      // Only the sequence is different
      expect(short.substring(0, 14)).toBe(long.replace('-', '').substring(0, 14));
      expect(short.substring(17)).toBe(long.replace('-', '').substring(17));
      expect(sequenceOf(long.replace('-', ''))).toBe(sequenceOf(short) + 1);
    });

    test('guids and short guids created alternately on the same millisecond are both sorted', () => {
      mockClock(T);
      const guids: string[] = [];
      const shortGuids: string[] = [];
      for (let i = 0; i < 5000; i++) {
        guids.push(guid());
        shortGuids.push(shortGuid());
      }
      expect(unique(guids)).toBe(guids.length);
      expect(unique(shortGuids)).toBe(shortGuids.length);
      expect(sorted(guids)).toEqual(guids);
      expect(sorted(shortGuids)).toEqual(shortGuids);
    });

    test('guids and short guids are sorted together by creation order when the hyphens are removed', () => {
      const clock = mockClock(T);
      const all: string[] = [];
      for (let i = 0; i < 5000; i++) {
        all.push(i % 2 ? shortGuid() : guid().replace(/-/g, ''));
        clock.tick(i % 3);
      }
      expect(sorted(all)).toEqual(all);
    });
  });

  describe('sortable between instances (like other processes or imports)', () => {
    test('short guids of different instances are sorted when created on different milliseconds', async () => {
      const clock = mockClock(T);
      const instances = [await loadModule(), await loadModule(), await loadModule()];
      const guids: string[] = [];
      for (let i = 0; i < 3000; i++) {
        guids.push(instances[i % 3].shortGuid());
        clock.tick();
      }
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
    });

    test('a new instance continues after the short guids of an older instance', async () => {
      const clock = mockClock(T);
      const guids: string[] = [];
      for (let i = 0; i < 10; i++) {
        const instance = await loadModule();    // Like an application restart
        for (let j = 0; j < 100; j++) guids.push(instance.shortGuid());
        clock.tick();
      }
      expect(sorted(guids)).toEqual(guids);
    });
  });

  describe('sortable with the real clock', () => {
    test('100000 short guids created in a row are different and sorted', () => {
      const guids: string[] = [];
      for (let i = 0; i < 100000; i++) guids.push(shortGuid());
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
    });

    test('short guids created with delays are sorted', async () => {
      const guids: string[] = [];
      for (let i = 0; i < 50; i++) {
        guids.push(shortGuid(), shortGuid(), shortGuid());
        await new Promise(resolve => setTimeout(resolve, i % 4));
      }
      expect(unique(guids)).toBe(guids.length);
      expect(sorted(guids)).toEqual(guids);
    });

    test('the timestamp of the short guid is the current time', () => {
      const before = Date.now();
      const value = shortGuid();
      const after = Date.now();
      expect(timestampOf(value)).toBeGreaterThanOrEqual(before);
      expect(timestampOf(value)).toBeLessThanOrEqual(after);
    });
  });
});
