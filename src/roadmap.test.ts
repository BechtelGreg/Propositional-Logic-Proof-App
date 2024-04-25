//
// describe("Arrays & Hashing", () => {
//     it("Contains Duplicate", () => {
//         function containsDuplicate(nums: number[]): boolean {
//             //return new Set(nums).size < nums.length
//             const set = new Set()
//             for (let num of nums) {
//                 if (set.has(num)) {
//                     return true
//                 }
//                 set.add(num)
//             }
//             return false
//         }
//     })
//
//     it("Valid Anagram", () => {
//         function isAnagram(s: string, t: string): boolean {
//             const smap = new Map<string, number>()
//             const tmap = new Map<string, number>()
//             for (let c of s) {
//                 smap.set(c, (smap.get(c) || 0) + 1)
//             }
//             for (let c of t) {
//                 tmap.set(c, (tmap.get(c) || 0) + 1)
//             }
//
//             if (smap.size !== tmap.size) {
//                 return false
//             }
//
//             for (let [key, value] of smap) {
//                 if (!(tmap.has(key) && tmap.get(key) === value)) {
//                     return false;
//                 }
//             }
//             return true
//         };
//     })
//
//     it("Two Sum", () => {
//         function twoSum(nums: number[], target: number): number[] {
//             const indexOf = new Map<number, number>();
//
//             for (let [i, n] of nums.entries()) {
//                 if (indexOf.has(target - n)) {
//                     return [i, indexOf.get(target - n) as number]
//                 }
//                 indexOf.set(n, i)
//             }
//             return []
//         }
//     })
//
//     it("Group Anagrams", () => {
//         type Character = string & { length: 1 }
//         type Anagram = { map: Map<Character, number>, signature: string }
//         const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
//         const toSignature = (map: Map<Character, number>): string => {
//             let r = `${letters[0]}:${map.get(letters[0] as Character) || 0}`
//             for (const ltr of letters.slice(1)) {
//                 const l = ltr as Character
//                 r += `, ${l}:${map.get(l) || 0}`
//             }
//             return r
//         }
//
//         const wordToAnagramType: (s: string) => Anagram =
//             s => {
//                 const smap = new Map<Character, number>()
//                 for (let c of s) {
//                     const ch = c as Character
//                     smap.set(ch, (smap.get(ch) || 0) + 1)
//                 }
//                 return {map: smap, signature: toSignature(smap)}
//             }
//
//         function groupAnagrams(strs: Array<string>): Array<Array<string>> {
//             const anagrams = new Map<Anagram['signature'], Array<string>>()
//             for (const wrd of strs) {
//                 const a = wordToAnagramType(wrd)
//                 anagrams.set(a.signature, [...anagrams.get(a.signature) || [], wrd])
//             }
//             return Array.from(anagrams.values())
//                 .map(s => Array.from(s))
//
//         }
//     })
//
//     it("topKFrequent", () => {
//         const constructFreqMap = <T>(it: Iterable<T>): Map<T, number> => {
//             const freqMap = new Map<T, number>()
//             for (const t of it) {
//                 freqMap.set(t, (freqMap.get(t) || 0) + 1)
//             }
//             return freqMap
//         }
//
//         function topKFrequent(nums: Array<number>, k: number): Array<number> {
//             const count = constructFreqMap(nums)
//             let freq: Array<Array<number>> = nums.map(n => [])
//             for (const [n, c] of count) {
//                 freq[c].push(n)
//             }
//             let res: Array<number> = []
//             for (let c = freq.length - 1; c >= 0; c--) {
//                 res = res.concat(freq[c])
//             }
//             return res
//         }
//
//         console.log(topKFrequent([1, 1, 1, 2, 2, 3], 2))
//     })
//
//     it("Product of Array Except self", () => {
//         function productExceptSelf(nums: number[]): number[] {
//             let res = []
//             let prefix = 1
//             for (let i = 0; i < nums.length; i++) {
//                 res[i] = prefix
//                 prefix *= nums[i]
//             }
//             let postfix = 1
//             for (let i = nums.length - 1; i >= 0; i--) {
//                 res[i] *= postfix
//                 postfix *= nums[i]
//             }
//             return res
//         }
//
//         const thing = new Array<Array<Set<number>>>(9)
//
//         console.log(JSON.stringify(thing))
//     })
//
//     it("valid sudoku", () => {
//         const board =
//             [
//                 ["5", "3", ".", ".", "7", ".", ".", ".", "."],
//                 ["6", ".", ".", "1", "9", "5", ".", ".", "."],
//                 [".", "9", "8", ".", ".", ".", ".", "6", "."],
//                 ["8", ".", ".", ".", "6", ".", ".", ".", "3"],
//                 ["4", ".", ".", "8", ".", "3", ".", ".", "1"],
//                 ["7", ".", ".", ".", "2", ".", ".", ".", "6"],
//                 [".", "6", ".", ".", ".", ".", "2", "8", "."],
//                 [".", ".", ".", "4", "1", "9", ".", ".", "5"],
//                 [".", ".", ".", ".", "8", ".", ".", "7", "9"]
//             ]
//
//         function isValidSudoku(board: Array<Array<string>>): boolean {
//             const nums = [0, 1, 2, 3, 4, 5, 6, 7, 8]
//             const init = () => new Set<string>()
//             const cols = nums.map(init)
//             const rows = nums.map(init)
//             const blocks = [1, 2, 3].map(nll => [1, 2, 3].map(init))
//             for (let i of nums) {
//                 for (let j of nums) {
//                     const cur = board[i][j]
//                     if (cur !== '.') {
//                         const curCol = cols[i];
//                         const curRow = rows[j];
//                         const curBlock = blocks[Math.floor(i / 3)][Math.floor(j / 3)];
//                         if (curCol.has(cur) || curRow.has(cur) || curBlock.has(cur)) {
//                             return false
//                         } else {
//                             curCol.add(cur)
//                             curRow.add(cur)
//                             curBlock.add(cur)
//                         }
//                     }
//                 }
//             }
//             return true
//         }
//
//         console.log("valid: ", isValidSudoku(board))
//     })
//
//     it("", () => {
//         function longestConsecutive(nums: number[]): number {
//             const set = new Set<number>(nums)
//             let max = 0
//             for (let n of nums) {
//                 if (!set.has(n - 1)) {
//                     let seqLen = 0
//                     while (set.has(n + seqLen)) {
//                         seqLen += 1
//                     }
//                     max = Math.max(seqLen, max)
//                 }
//             }
//             return max
//         }
//     })
// })
//
// describe("Stack", () => {
//     it("valid Parenthesis", () => {
//         const match: Map<string, string> = new Map([
//             ['(', ')'],
//             ['{', '}'],
//             ['[', ']']
//         ])
//
//         const containsValue = <T, U>(m: Map<T, U>) => (u: U) => {
//             for (let v of m.values()) {
//                 if (u === v) {
//                     return true
//                 }
//             }
//             return false
//         }
//
//         const matchHasValue = containsValue(match)
//
//         function isValid(s: string): boolean {
//             const stack = []
//             for (let c of s) {
//                 if (match.has(c)) {
//                     stack.push(match.get(c))
//                 } else if (matchHasValue(c)
//                     && (stack.length === 0 || stack.pop() !== c)) {
//                     return false
//                 }
//             }
//             return stack.length === 0
//         }
//     })
//
//     it("MinStack", () => {
//
//         const top = <T>(arr: Array<T>): T => arr[arr.length - 1]
//
//         class MinStack {
//             private stack: Array<number>
//             private minstack: Array<number>
//
//             constructor() {
//                 this.minstack = []
//                 this.stack = []
//             }
//
//             push(val: number): void {
//                 this.stack.push(val)
//                 const min = Math.min(
//                     val,
//                     this.minstack.length > 0
//                         ? top(this.minstack)
//                         : val
//                 )
//                 this.minstack.push(min)
//             }
//
//             pop(): void {
//                 this.stack.pop()
//                 this.minstack.pop()
//             }
//
//             top(): number {
//                 return top(this.stack)
//             }
//
//             getMin(): number {
//                 return top(this.minstack)
//             }
//         }
//     })
//
//     it("eval RPN", () => {
//         type Op = (n: number, m: number) => number
//         const ops = new Map<string, Op>([
//             ['+', (n, m) => n + m],
//             ['-', (n, m) => n - m],
//             ['*', (n, m) => n * m],
//             ['/', (n, m) => Math.floor(n / m)]
//         ])
//
//
//         function evalRPN(tokens: string[]) {//: number {
//             const stack = []
//             for (let t of tokens) {
//                 if (ops.has(t)) {
//                     const m = stack.pop() as number
//                     const n = stack.pop() as number
//                     const op = ops.get(t) as Op;
//                     stack.push(op(n, m))
//                 } else {
//                     stack.push(parseInt(t))
//                 }
//             }
//             return stack[0]
//         }
//     })
//
//     it('generate parentheses', () => {
//         function generateParenthes(n: number) {
//             const stack = []
//             const res = []
//
//             const bcktrck = (openCnt: number, closedCnt: number) => {
//                 if (closedCnt === openCnt && openCnt === n) {
//                     res.push(stack.join(''))
//                 }
//
//                 if (openCnt < n) {
//                     stack.push('(')
//                     bcktrck(openCnt + 1, closedCnt)
//                     stack.pop()
//                 }
//
//                 if (closedCnt < openCnt) {
//                     stack.push(')')
//                     bcktrck(openCnt, closedCnt + 1)
//                     stack.pop()
//                 }
//             }
//
//             bcktrck(0, 0)
//             return res
//         }
//     })
//
//     it('Daily Temperatures', () => {
//
//     })
// })
//
// describe('Two Pointers', () => {
//     it('isPalindrome', () => {
//         function isAlphaNumeric(str) {
//             var code, i, len;
//
//             for (i = 0, len = str.length; i < len; i++) {
//                 code = str.charCodeAt(i);
//                 if (!(code > 47 && code < 58) && // numeric (0-9)
//                     !(code > 64 && code < 91) && // upper alpha (A-Z)
//                     !(code > 96 && code < 123)) { // lower alpha (a-z)
//                     return false;
//                 }
//             }
//             return true;
//         }
//
//         function isPalindrome(s: string): boolean {
//             let i = 0
//             let j = s.length - 1
//             while (i < j) {
//                 const si = s.charAt(i);
//                 const sj = s.charAt(j);
//                 if (!isAlphaNumeric(si)) {
//                     i++
//                 } else if (!isAlphaNumeric(sj)) {
//                     j--
//                 } else if (si.toLowerCase() !== sj.toLowerCase()) {
//                     return false
//                 } else {
//                     i++
//                     j--
//                 }
//             }
//             return true
//         }
//     })
// })
//
// describe('Binary Search', () => {
//     it('Min in Rotated Sorted array', () => {
//         function findMin(nums: number[]): number {
//             let l = 0
//             let r = nums.length - 1
//             let min = nums[0]
//             while (l <= r) {
//                 const sortedSubsection = nums[l] <= nums[r];
//                 if (sortedSubsection) {
//                     return Math.min(min, nums[l])
//                 }
//
//                 const mid = Math.floor((l + r) / 2)
//                 min = Math.min(min, nums[mid])
//
//                 const minOnLeft = nums[l] > nums[mid];
//                 if (minOnLeft) {
//                     r = mid - 1
//                 } else {
//                     l = mid + 1
//                 }
//             }
//             return min
//         }
//     })
//
//     it('Search in Rotated Sorted Array', () => {
//         function search(nums: number[], target: number): number {
//             let l = 0
//             let r = 1
//
//             while (l <= r) {
//                 const mid = Math.floor((l + r) / 2)
//                 if (nums[mid] === target) {
//                     return mid
//                 }
//
//                 const leftSubArrSorted = nums[l] <= nums[mid];
//                 const rightSubArrSorted = nums[mid] <= nums[r];
//                 const inLeftSub = nums[l] <= target && target <= nums[mid];
//                 const inRightSub = nums[mid] <= target && target <= nums[r];
//                 if (nums[mid] <= target && target <= nums[r]) {
//                     l = mid + 1
//                 }
//
//                 if ((leftSubArrSorted && inLeftSub) || (rightSubArrSorted && !inRightSub)) {
//                     r = mid - 1;
//                 } else {
//                     l = mid + 1;
//                 }
//             }
//             return -1
//         }
//     })
//
//     it('time-map one', () => {
//         class TimeMap {
//
//             private map: Map<string, Array<[number, string]>>
//
//             constructor() {
//                 this.map = new Map<>()
//             }
//
//             set(key: string, value: string, timestamp: number): void {
//                 const arr = this.map.get(key) || []
//                 arr.push([timestamp, value])
//                 this.map.set(key, arr)
//             }
//
//             get(key: string, timestamp: number): string {
//                 let res = ''
//                 const arr = this.map.get(key)
//
//                 if (arr) {
//                     let l = 0, r = arr.length - 1
//                     while (l <= r) {
//                         const mid = Math.floor((l + r) / 2)
//                         if (arr[mid][0] === timestamp) {
//                             return arr[mid][1]
//                         }
//
//                         if (arr[mid][0] < timestamp) {
//                             res = arr[mid][1]
//                             l = mid + 1
//                         } else {
//                             r = mid - 1
//                         }
//                     }
//                 }
//                 return res
//             }
//         }
//
//         /**
//          * Your TimeMap object will be instantiated and called as such:
//          * var obj = new TimeMap()
//          * obj.set(key,value,timestamp)
//          * var param_2 = obj.get(key,timestamp)
//          */
//     })
// })
//
// describe('LinkedList', () => {
//
//     type ListNode = { val: number, next: ListNode }
//
//     it('reverseList', () => {
//         function reverseList(head: ListNode | null): ListNode | null {
//             if (head === null) return head
//
//             const tail = head.next
//
//             const newHead = reverseList(tail)
//             newHead?.next
//         }
//
//
//         class Node {
//             val: number
//             next: Node | null
//             random: Node | null
//
//             constructor(val?: number, next?: Node, random?: Node) {
//                 this.val = (val === undefined ? 0 : val)
//                 this.next = (next === undefined ? null : next)
//                 this.random = (random === undefined ? null : random)
//             }
//         }
//
//         function isAnagram(s: string, t: string): boolean {
//             if (s.length === t.length) {
//                 const smap = freqMap(s)
//                 const tmap = freqMap(t)
//
//                 return Array.from(smap)
//                     .reduce(
//                         (sameMappingSoFar, [k, v]) =>
//                             sameMappingSoFar
//                             && tmap.has(k)
//                             && tmap.get(k) === v,
//                         true
//                     )
//
//             }
//             return false
//         };
//
//         function freqMap<T>(it: Iterable<T>) {
//             const map = new Map<T, number>()
//             for (let t of it) {
//                 map.set(t, (map.get(t) || 0) + 1)
//             }
//             return map
//         }
//
//         const queue = <T>(q: Array<T>) => {
//             let h = 0
//             return {
//                 dq: () => q[h++],
//                 size: () => q.length - h,
//                 push: (t: T) => q.push(t)
//             }
//         }
//     })
//
//     it('', () => {
//
//         class Node {
//             val: number
//             neighbors: Node[]
//
//             constructor(val?: number, neighbors?: Node[]) {
//                 this.val = (val === undefined ? 0 : val)
//                 this.neighbors = (neighbors === undefined ? [] : neighbors)
//             }
//         }
//
//
//         const copy = (n: Node) => {
//             return new Node(n.val)
//         }
//
//         function cloneGraph(node: Node | null): Node | null {
//             const cloneWith = (m: Map<Node, Node>) => (n: Node) => {
//                 if (!m.has(n)) {
//                     m.set(n, new Node(n.val, n.neighbors.map(cloneWith(m))));
//                 }
//                 return m.get(node as Node) as Node
//             }
//
//             return cloneWith(new Map())(node)
//         };
//     })
//
//     it('isathing', () => {
//         function pacificAtlantic(heights: number[][]): number[][] {
//             type OceansReached = { pacific: boolean, atlantic: boolean }
//             const visited = new Map<string, OceansReached>()
//             const str = (i, j) => `${i}, ${j}`
//             const dir = [
//                 [-1, 0],
//                 [1, 0],
//                 [0, -1],
//                 [0, 1]
//             ]
//
//             const inBounds = (i, j): boolean => {
//                 return (0 <= i && i < heights.length)
//                     && (0 <= j && j < heights[0].length)
//             }
//
//             const neighbors = (i: number, j: number): Array<[number, number]> => {
//                 return dir.map(([di, dj]) => [i + di, j + dj])
//             }
//
//             const isPacific = (i: number, j: number) => i < 0 || j < 0
//
//             const isAtlantic = (i, j) => i >= heights.length || j >= heights[0].length
//
//             const updateIfTrue = (
//                 org: OceansReached | undefined,
//                 {pacific: newPac, atlantic: newAt}: OceansReached
//             ) => {
//                 if (!org) {
//                     org = {pacific: false, atlantic: false}
//                 }
//                 if (newPac || newAt) {
//                     return {
//                         pacific: newPac ? newPac : org.pacific,
//                         atlantic: newAt ? newAt : org.atlantic
//                     }
//                 }
//                 return org
//             }
//
//             const dfs = (i, j): OceansReached | undefined => {
//                 const ijKey = str(i, j);
//                 if (!visited.has(ijKey)) {
//                     const pacific = isPacific(i, j);
//                     const atlantic = isAtlantic(i, j);
//                     visited.set(ijKey, {pacific, atlantic})
//                     if (!pacific && !atlantic) {
//                         for (let [ni, nj] of neighbors(i, j)) {
//                             if (!inBounds(ni, nj) || heights[ni][nj] <= heights[i][j]) {
//                                 const chRes = dfs(ni, nj) as OceansReached
//                                 const orgRes = visited.get(ijKey)
//                                 visited.set(ijKey, updateIfTrue(orgRes, chRes))
//                             }
//                         }
//                     }
//                 }
//                 return visited.get(ijKey)
//             }
//
//             let res = []
//             for (let i = 0; i < heights.length; i++) {
//                 for (let j = 0; j < heights[0].length; j++) {
//                     let {pacific, atlantic} = dfs(i, j)
//                     if (pacific && atlantic) {
//                         res.push([i, j])
//                     }
//                 }
//             }
//             return res
//         };
//     })
//
//     it('is another thing', () => {
//         // function solve(board: string[][]): void {
//         //     let persisting = new Set()
//         //     const isZero = (s: string) => s === '0'
//         //
//         //     for (let j = 0; j < board[0].length; j++) {
//         //         if (isZero(board[0][j])) {
//         //             persisting.add()
//         //         }
//         //         persisting.add(board[board.length - 1][j])
//         //     }
//         //     for (let i = 0; i < board.length; i++) {
//         //         persisting.add(board[i][0])
//         //         persisting.add(board[i][board.length[0] - 1])
//         //     }
//         // };
//     })
// })
//
// describe('backtracking', () => {
//     it('permutations', () => {
//
//         function permute(nums: number[]): number[][] {
//             if (nums.length <= 1) {
//                 return nums.length === 1
//                     ? [[nums[0]]]
//                     : []
//             } else {
//                 let res = []
//                 for (let i of nums) {
//                     let n = nums.shift()!
//                     res = res.concat(permute(nums).forEach(perm => [...perm, n]))
//                     nums.push(n)
//                 }
//                 return res
//             }
//         };
//     })
//
//     it('', () => {
//         class LRUCache {
//             private readonly capacity: number
//             private readonly list: Exclude<Node<number, number>, null>
//             private map: Map<number, Node<number, number>>
//
//             constructor(capacity: number) {
//                 this.capacity = capacity
//                 this.list = Sentinal()
//                 this.map = new Map<number, Node<number, number>>()
//             }
//
//             get(key: number): number {
//                 let v = -1
//                 if (this.map.has(key)) {
//                     let n = this.map.get(key)!
//                     this.remove(n)
//                     this.setMRU(n)
//                     v = n.v
//                 }
//                 return v
//             }
//
//             put(key: number, value: number): void {
//                 if (this.map.has(key)) {
//                     let n = this.map.get(key)!
//                     n.v = value
//                     this.remove(n)
//                     this.setMRU(n)
//                 } else {
//                     let n = Node(key, value)
//                     this.map.set(key, n)
//                     this.setMRU(n)
//                     if (this.map.size > this.capacity) {
//                         const lru = this.list.prev!;
//                         this.map.delete(lru.k)
//                         this.remove(lru)
//                     }
//                 }
//             }
//
//             remove(n: Node<number, number>) {
//                 if (n) {
//                     const [prev, next] = [n.prev!, n.next!]
//                     prev.next = next
//                     next.prev = prev
//                     n.next = null
//                     n.prev = null
//                 }
//             }
//
//             setMRU(n: Node<number, number>) {
//                 if (n) {
//                     n.next = this.list.next
//                     this.list.next = n
//                     n.prev = this.list
//                     let nxt = n.next!
//                     nxt.prev = n
//                 }
//             }
//         }
//
//         type Node<K, V> = { k: K, v: V, prev: Node<K, V>, next: Node<K, V> } | null
//         const Node = <K, V>(k: K, v: V): Exclude<Node<K, V>, null> => ({k, v, prev: null, next: null})
//         const Sentinal = (): Exclude<Node<number, number>, null> => {
//             const n = Node(0, 0)
//             n.next = n
//             n.prev = n
//             return n
//         }
//     })
//
//     it('ew', () => {
//         class MyHashSet {
//             private arr: Array<Array<number>>
//             private size: number
//
//             constructor() {
//                 this.arr = [...new Array(10).keys()].map(i => [])
//                 this.size = 0
//             }
//
//             add(key: number): void {
//                 let i = this.hsh(key)
//                 if (!this.arr[i].some(k => k === key)) {
//                     this.arr[i].push(key)
//                     this.size++
//                     if (this.size * 2 > this.arr.length) {
//                         let newarr: Array<Array<number>>
//                             = [...new Array(this.arr.length * 2).keys()].map(i => [])
//                         this.arr.forEach(ar => {
//                             ar.forEach(k => {
//                                 let j = k % (this.arr.length * 2)
//                                 newarr[j].push(k)
//                             })
//                         })
//                         this.arr = newarr
//                     }
//                 }
//             }
//
//             remove(key: number): void {
//                 let i = this.hsh(key)
//                 this.arr[i] = this.arr[i].filter(k => {
//                     let pass = k !== key
//                     if (!pass) {
//                         this.size--
//                     }
//                     return pass
//                 })
//             }
//
//             contains(key: number): boolean {
//                 let i = this.hsh(key)
//                 return this.arr[i].some(k => k === key)
//             }
//
//             hsh(k: number): number {
//                 return k % this.arr.length
//             }
//         }
//
//
//         class MyHashMap {
//             private arr: Array<Array<[number, number]>>
//             private size: number
//
//             constructor() {
//                 this.arr = [...new Array(10).keys()].map(i => [])
//                 this.size = 0
//             }
//
//             get(key: number): number {
//                 let i = this.hsh(key)
//                 let value = -1
//                 this.arr[i].forEach(p => {
//                     if (p[0] === key) {
//                         value = p[1]
//                     }
//                 })
//
//                 return value
//             }
//
//             put(key: number, value: number): void {
//                 if (!this.contains(key)) {
//                     let i = this.hsh(key)
//                     this.arr[i].push([key, value])
//                     this.size++
//                     if (this.size * 2 > this.arr.length) {
//                         this.resize()
//                     }
//                 }
//             }
//
//             remove(key: number): void {
//                 let i = this.hsh(key)
//                 let found = false
//                 this.arr[i] = this.arr[i].filter(
//                     p => {
//                         let keep = p[0] !== key
//                         if (!keep) {
//                             this.size -= 1
//                         }
//                         return keep
//                     })
//             }
//
//             contains(key: number): boolean {
//                 let i = this.hsh(key)
//                 return this.arr[i].some(p => p[0] === key)
//             }
//
//             resize() {
//                 let len = this.arr.length
//                 let newarr: Array<Array<[number, number]>>
//                     = [...new Array(len * 2).keys()].map(i => [])
//                 this.arr.forEach(ar => {
//                     ar.forEach(p => {
//                         let j = p[0] % (this.arr.length * 2)
//                         newarr[j].push(p)
//                     })
//                 })
//                 this.arr = newarr
//             }
//
//             hsh(k: number): number {
//                 return k % this.arr.length
//             }
//         }
//
//
//     })
//
//     it("has bad alloc", () => {
//         const queue = <T>(arr: Array<T>) => {
//             let h = 0
//             return {
//                 dq: () => arr[h++],
//                 nq: (t: T) => arr.push(t),
//                 size: () => arr.length - h
//             }
//         }
//
//         const dir = [
//             [-1, 0],
//             [1, 0],
//             [0, -1],
//             [0, 1],
//             [-1, -1],
//             [-1, 1],
//             [1, -1],
//             [1, 1]
//         ]
//
//         function neighbors(n: [number, number]): Array<[number, number]> {
//             return dir.map(([di, dj]) => [di + n[0], dj + n[1]])
//         }
//
//         const validIn = (grid: number[][]) => (i: number, j: number) => {
//             return 0 <= i && i < grid.length
//                 && 0 <= j && j < grid[0].length
//         }
//
//         function shortestPathBinaryMatrix(grid: number[][]): number {
//             const isValid = validIn(grid)
//             let q = queue<[number, number]>([[0, 0]])
//             let visited = new Set<[number, number]>()
//             const [endi, endj] = [grid.length, grid[0].length]
//             let path = 0
//             while (q.size() > 0) {
//                 let qsize = q.size()
//                 for (let i = 0; i < qsize; i++) {
//                     let n = q.dq()
//                     if (n[0] === endi && n[1] === endj) {
//                         return path
//                     }
//                     for (let [ni, nj] of neighbors(n)) {
//                         if (isValid(ni, nj)
//                             && !visited.has([ni, nj])
//                             && grid[ni][nj] === 0) {
//                             q.nq([ni, nj])
//                             visited.add([ni, nj])
//                         }
//                     }
//                 }
//                 path++
//             }
//             return -1
//         };
//     })
//
//     it('isGraphy', () => {
//         type Nod = {val: number, nbrs: Array<Nod>}
//
//
//         const buildGraph = (n: number, pre: Array<Array<number>>): Map<number, Array<number>> => {
//             const m = new Map<number, Array<number>>()
//             for (let i = 0; i < n; i++) {
//                 let [c, r] = pre[i]
//                 const nbrs = m.get(c) || [];
//                 nbrs.push(r)
//                 m.set(c, nbrs)
//             }
//             return m
//         }
//         function canFinish(numCourses: number, prerequisites: Array<Array<number>>): boolean {
//             const m = buildGraph(numCourses, prerequisites)
//             const visiting = new Set<number>()
//             const visited = new Map<number, boolean>()
//             const dfs = (n: number) => {
//                 if (visiting.has(n)) {
//                     visited.set(n, false)
//                 }
//                 const nbrs = m.get(n)!;
//                 if (nbrs.length === 0) {
//                     visited.set(n, true)
//                 }
//                 if (!visited.has(n)) {
//                     for (const nbr of m.get(n)!) {
//                         if (!dfs(nbr)) {
//                             visited.set(n, false)
//                             break
//                         }
//                     }
//                 }
//                 if (!visited.has(n)) {
//                     visited.set(n, true)
//                 }
//                 return visited.get(n)!
//             }
//
//             for (let i = 0; i < numCourses; i++) {
//                 if (!dfs(i)) {
//                     return false
//                 }
//             }
//             return true
//         }
//     })
//
// })
//
