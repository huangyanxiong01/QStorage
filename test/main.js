const fs = require("fs")
const stream = fs.createReadStream("./a.jpg")

function sleep () {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, 1000)
  })
}

stream.on("end", function () {
  console.log("end")
})

stream.on("readable", async _ => {
  while (true) {
    void await sleep()
    let data = stream.read(1048576)
    if (data) {
      console.log(data)
    } else {
      break
    }
  }
})