/**
 * Min-heap implementation, based on Durr and Vie (2021)
 * Copied from cave-dungeons
 */

class Heap {
  /**
   * Creates a new priority queue heap from an initial list.
   * @param {Array.<any>} items The initial list.
   * @param {function} compareFn The comparator.
   */
  constructor(items, compareFn) {
    this.heap = [0];
    this.rank = [];
    this.compareFn = compareFn;
    for(let x of items) {
      this.push(x);
    }
  }

  /**
   * Pushes an element into the heap.
   * @param {any} x The element to push.
   */
  push(x) {
    let i = this.heap.length;
    this.heap.push(x);
    this.up(i);
  }

  /**
   * Pops the top element from the heap.
   * @returns The top element.
   */
  pop() {
    let root = this.heap[1];
    let x = this.heap.pop();
    if (this.heap.length > 1) {
      this.heap[1] = x;
      this.down(1);
    }
    return root;
  } 

  /**
   * Enforces heap structure, starting from an element and going up.
   * @param {number} i The index of the element.
   */
  up(i) {
    let x = this.heap[i];
    while(i > 1 && this.compareFn(x, this.heap[Math.floor(i/2)]) < 0) {
      this.heap[i] = this.heap[Math.floor(i/2)];
      i = Math.floor(i/2);
    }
    this.heap[i] = x;
  }

  /**
   * Enforces heap structure, starting from an element and going down.
   * Also known as heapify.
   * @param {number} i The index of the element.
   */
  down(i) {
    let x = this.heap[i];
    let n = this.heap.length;
    // eslint-disable-next-line no-constant-condition
    while(true) {
      let left = 2 * i;
      let right = left + 1;
      if(right < n && this.compareFn(this.heap[right], x) < 0
        && this.compareFn(this.heap[right], this.heap[left]) < 0) {
        this.heap[i] = this.heap[right];
        i = right;
      }
      else if(left < n && this.compareFn(this.heap[left], x) < 0) {
        this.heap[i] = this.heap[left];
        i = left;
      }
      else {
        this.heap[i] = x;
        return;
      }
    }
  }

  /**
   * Prints the number of elements, followed by each element.
   */
  print() {
    console.log("Number of elements: ".concat(this.heap.length - 1));
    for(let i of this.heap) {
      console.log(i);
    }
    console.log(" -- ");
  }
}