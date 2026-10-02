# guid()

A simple guid generator based on timestamp!

**Within one process the guids are always unique. Across processes, the chance to get the same guid on the same millisecond is one in 295,147,905,179,352,825,856!**

## Samples

139aca66-2024bc60-2f847b9701be62a163 // Fixed length: 36

12f5ade5-54356610-2f847b9702f0b91635

216f48d8-233eb6b0-2f847b970379de20d6

## Comparison with others

```
dyna guid v2: 1e955ef4-47939014-2f847b9700c03a2a3b

dyna guid v1: 1g6263bg-1h2c3a89-18046497750547120

   .net guid: 30dd879c-ee2f-11db-8314-0800200c9a66
```

The difference is that dyna guid is 
- hard to generate the same on the same millisecond per timezone _and_
- impossible to generate the same on next millisecond!

## dyna guid syntax

```
<timestamp in ms (14 digits)><sequence (3 digits)><random...>   split as   <block>-<block>-<last block>
```

The guids are sortable as plain strings by creation time, also when they are created on the same millisecond (the sequence keeps the order).

The default of the blocks is 2, would be 1 or any other number.

## Usage

```
import {guid} from "dyna-guid";

console.log('guid', guid());
console.log('even stronger guid', guid(3));
  
```  

## Signature

`function guid(randomBlocks: number = 2): string`

Block is a set of 8 chars separated with dashes.

If you need even more complex guids (!why?) you can increase the number of blocks. Or for shorter set it to 1.

# Short GUID

Short GUID is a one block guid without hyphen. Useful for short unique ids, easy to copy-paste them.

## Samples

2024bc602f847b9701be62a163 // Fixed length: 26

543566102f847b9702f0b91635

233eb6b02f847b970379de20d6

## dyna guid syntax

```
<timestamp in ms (14 digits)><sequence (3 digits)><random (9 hex)>
```

Sortable, like the guid.
## Usage

```
import {shortGuid} from "dyna-guid";

console.log('guid', shortGuid());
  
```  
## Signature

`function shortGuid(): string`

# Change log

## V1 05-Aug-2017

Sample: 1g6263bg-1h2c3a89-18046497750547120

## V2 20-Jan-2022

Sample: 18ee7d36-14d00ef3-2f847b9703c45725c7

- Fixed size, doesn't change cause current date
- Better random blocks

## V2 June-2024

- short guid

## V2 October-2026

Sample: 01790945-68137700-0d6da4852c768078f3

- Sortable guids and short guids, by creation time, even on the same millisecond
- Same schema and size, backwards compatible
