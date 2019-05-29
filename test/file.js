const qostorage = require("../storage")

const storage = new qostorage({
  pathname: "./storage",       // Storage directory.
  chunkSize: 10737418240,      // File fragment size.
  blockSize: 1048576       // Block size.
})

process.on("beforeExit", async function () {
  void await storage.drop()
  process.exit(0)
})

storage.on("ready", async function () {
  void await storage.insert("hello", "word")
  let data = await storage.get("hello")
  data && console.log(data.toString())    // "word"
})