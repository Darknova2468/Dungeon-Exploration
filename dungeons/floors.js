/*
  Temporary file containing the data for floors.
  May be made into text file and importer function, or kept if low on time.
 */

/**
 * Format for floors:
 * [# of rooms, [[
 *   lower difficulty bound, upper difficulty bound
 * ] (for each enemy type)], 
 * twoPathChance, caveEdgeChance, denseCaveEdgeChance]
 */

const floors = [
  [1, [[0, 0], [0, 0], [0, 0], [0, 0]], 0, 0, 0],
  [5, [[1, 10], [0, 0], [0, 0], [0, 0]], 0.7, 0.7, 0.8],
]