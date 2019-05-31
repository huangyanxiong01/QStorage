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
  //console.log(await fp.FsStat(await fp.OpenFile("./a.jpg")))
  void await storage.remove("test")
  // void await storage.remove("mp4")

  void await storage.push("test", fs.createReadStream("./a.jpg"))
  void await storage.pull("test", fs.createWriteStream("./test.jpg"))

  // void await storage.push("mp4", fs.createReadStream("E:/movie/八恶人.mp4"))
  // void await storage.pull("mp4", fs.createWriteStream("./test.mp4"))
  
  // void await storage.insert("hello", "word")
  // let data = await storage.get("hello")
  // data && console.log(data.toString("utf8"))
})