// QStorage
// Copyright 2019 Mr.Panda <xivistudios@gmail.com>
// MIT License
"use strict"


// package.
// @package
const fs = require("./fs")
const path = require("path")
const util = require("./util")


// Chunk
// @class
function Chunk (pathname, chunk_size) {
  this.CHUNK_SIZE = chunk_size
  this.PATH_NAME = pathname
  this.CHUNKS = []
  this.SIZE = 0
}


// Initialize fragmentation.
// Initialize all shards.
// Get the file handle of the slice.
// @params {string} pathname
// @params {array} chunks
// @public
Chunk.prototype.init = async function (chunks) {
  for (let value of chunks) {
    let filename = path.join(this.PATH_NAME, value.name)
    let context = await fs.OpenFile(filename)
    this.CHUNKS.push(Object.assign(value, { context }))
    this.SIZE += value.size
  }
}


// Create a shard file.
// @public
Chunk.prototype.crate = async function () {
  let name = "chunk." + this.CHUNKS.length + ".qs"
  let filename = path.join(this.PATH_NAME, name)
  let context = await fs.OpenFile(filename)
  this.CHUNKS.push({ name, context, size: 0 })
}


// Data input.
// @params {buffer} data
// @params {number} start
// @public
Chunk.prototype.write = async function (data, start) {
  let group = util.writeGroup(data.length, start, this.CHUNK_SIZE)
  this.SIZE += data.length
  for (let [ i, p, o, s ] of group) {
    
    // Fragment does not exist.
    // Create a new shard.
    if (!this.CHUNKS[i]) {
      void await this.crate()
    }
    
    // Write data to file.
    let { context } = this.CHUNKS[i]
    void await fs.FsWrite(context, data, p, s, o)
  }
}


// Get the length of the slice.
// @public
Chunk.prototype.len = function () {
  return this.SIZE
}


// Read data.
// @params {number} offset
// @params {number} len
// @public
Chunk.prototype.read = async function (offset, len) {
  let group = util.readGroup(this.CHUNK_SIZE, offset, len)
  let bufs = Buffer.alloc(0)
  
  // Traversing the read group.
  // read the contents of each segment.dd
  // merge content.
  for (let [ i, o, l ] of group) {
    let { context } = this.CHUNKS[i]
    let data = await fs.FsRead(context, o, l)
    bufs = Buffer.concat([ bufs, data ])
  }
  
  // Return data.
  return bufs.slice(0, len)
}


// export.
module.exports = Chunk