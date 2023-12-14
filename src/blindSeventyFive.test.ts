




describe("Blind 75", () => {
    it("twoSum", () => {
        function twoSum(nums: number[], target: number): number[] {
            const valueToIndex = new Map<number, number>()
            for (const [idx, n] of nums.entries()) {
                const match = target - n
                const i = valueToIndex.get(match)
                if (i !== undefined) {
                    return [idx, i]
                }
                valueToIndex.set(n, idx)
            }
            return []
        }
    })

    it("containsDuplicates", () => {
        function containsDuplicate(nums: number[]): boolean {
            const set = new Set<number>(nums)
            return set.size < nums.length
        }

        function containsNearbyDuplicate(nums: number[], k: number): boolean {
            const map = new Map();
            const check = foo(k)(nums)(map)

            for (let j = 0; j < nums.length; j += 1) {
                const found = check(j);
                if (found) {
                    return true
                } else {
                    map.set(nums[j], j)
                }
            }

            return false
        }

        const set = <K, V>(map: Map<K, V>) => (key: K) => (value: V): Map<K, V> => {
            map.set(key, value)
            return map
        }

        const foo =
            (k: number) =>
                (nums: Array<number>) =>
                    (map: Map<number, number>) =>
                        (idx: number): boolean => {
                        return map.has(nums[idx]) && idx - (map.get(nums[idx]) as number) <= k
                    }

        const containsNearbyDuplicateF = (k: number) => (nums: Array<number>): boolean => {

        }

        console.log(containsNearbyDuplicate([4, 1, 2, 3, 1, 5], 3))
    })

    it('max Profit', () => {
        const priceGiven = (prices: Array<number>) => (day: number): number => {
            return 0 <= day && day < prices.length
                ? prices[day]
                : Number.POSITIVE_INFINITY
        }
        function maxProfit(prices: number[]): number {
            const price = priceGiven(prices)
            let bestBuyDate = -1s
            let max = 0
            for (let day = 0; day < prices.length; day++) {
                if (price(day) < price(bestBuyDate)) {
                    bestBuyDate = day
                }
                const gainPotentialToday = price(day) - price(bestBuyDate)
                if (gainPotentialToday > max) {
                    max = gainPotentialToday
                }
            }
            return max;
        };
    });
})
