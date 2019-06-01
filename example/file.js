const qostorage = require("../storage")
const fs = require("fs")
const fp = require("../core/fs")

const storage = new qostorage({
  pathname: "../storage",       // Storage directory.
  chunkSize: 10737418240,      // File fragment size.
  blockSize: 1048576       // Block size.
})

process.on("beforeExit", async function () {
  void await storage.drop()
  process.exit(0)
})

storage.on("ready", async function () {
  void await storage.push("test", fs.createReadStream("./a.jpg"))
  void await storage.pull("test", fs.createWriteStream("./test.jpg"))
  
  void await storage.insert("hello", "word")
  let data = await storage.get("hello")
  data && console.log(data.toString("utf8"))
  
  void await storage.remove("hello")
})