![QStorage Logo](./logo.png)

File system based object storage, can also be used as a persistent KV database.


## Overview

* This is a file system based single-threaded object storage system. Currently, there is no multi-threading support, no read-write locks, and no isolation locks.</br>
* The data is stored as a shard file in the file system. You can define the size of the shard. The fragment content is divided into blocks. Again, you can customize the block size.</br>
* Equivalent to the file system, the data is divided into multiple blocks. When writing, the block index position is recorded. Deleting data marks only the block as invalid and does not delete the block data. When the next data arrives, it writes the failed block, overwriting the old data. The current version does not implement file defragmentation, so there may be invalid data fragmentation, but it does not affect normal use, but it wastes storage space.</br>
* The system does not implement file information, just ordinary KV storage. Note that if you need to store file information, rely on other implementations to store file information.</br>


## Version

* 1.0.4


## Quick start

Install npm package dependencies.
```bash
npm i qostorage
```

This is an example code.
```js
const qostorage = require("qostorage")
const storage = new qostorage({
  pathname: "./storage",       // Storage directory.
  chunkSize: 1024,      // File fragment size.
  blockSize: 100       // Block size.
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
```


## API

#### new (options)
> Create an instance.
* `Class`.
* `options` `{object}`.
* `[options.pathname]` `{string}` Storage directory.
* `[options.chunkSize]` `{number}` File fragment size.
* `[options.blockSize]` `{number}` Block size.
* `return` `{class}`

#### .on(event, handle)
> Binding event loop.
* `Function`.
* `event` `{string}` Event name.
* `handle` `{function}` Callback function.
* `return` `void`

#### .insert(key, value)
> Write key value.
* `Promise`.
* `key` `{string}` Key name (Special characters and symbols are not allowed).
* `value` `{string || buffer || int array}` value data.
* `return` `Promise`

#### .get(key)
> Get key data.
* `Promise`.
* `key` `{string}` Key name.
* `return` `{buffer}` value data.

#### .remove(key)
> Delete key value.
* `Function`.
* `key` `{string}` Key name.
* `return` `{boolean}` Whether to delete the completion.

#### .push(key, stream)
> Write data stream.
* `Promise`.
* `key` `{string}` Key name.
* `stream` `{Stream}` Readable Streams.
* `return` `Promise`

#### .pull(key, stream)
> Read data stream.
* `Promise`.
* `key` `{string}` Key name.
* `stream` `{Stream}` Writable Streams.
* `return` `Promise`

#### .drop()
> Clean up before shutdown.</br>
> This is a required operation. You must do the final cleanup before each shutdown, save the state, you can also call this function each time you need to save the state.</br>
> This operation will write the memory data to the file system.</br>
> For example, listen to the exit event of the process, and then call this function.</br>
* `Promise`.
* `return` `void`.


## License
[MIT](./LICENSE)
Copyright (c) 2019 Mr.Panda.