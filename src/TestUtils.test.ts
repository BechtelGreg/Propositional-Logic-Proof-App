import {getRandomObject, getRandomString} from "./TestUtils";

describe("dd", () => {
    it("ss", () => {
        let s: string = "p"
        while (s !== '') {
            console.log(`Not empty yet: ${s}`)
            s = getRandomString()
        }
        console.log(`Empty! : ${s}`)
    })

    it("randomObj", ()=> {
        console.log(JSON.stringify(getRandomObject(), null, 2))
    })
})