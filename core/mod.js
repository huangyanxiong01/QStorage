// QStorage
// Copyright 2019 Mr.Panda <xivistudios@gmail.com>
// MIT License
"use strict"


// package.
// @package
const fs = require("./fs")
const path = require("path")
const engine = require("./engine")
const chunk = require("./chunk")
const { EventEmitter } = require("events")


// Core.
// @class
function Core ({ 
  pathname,       // Storage directory.
  chunkSize,      // File fragment size.
  blockSize       // Block size.
}) {
  this.chunk = new chunk(pathname, chunkSize)
  this.engine = new engine(blockSize, this.chunk)
  this.events = new EventEmitter()
  this.BLOCK_SIZE = blockSize
  this.PATH_NAME = pathname
  this.CHUNK_SIZE = chunkSize
  this.LINS_SPLIT = "/"
  this.LINS_HEAD_SPLIT = "-"
  this.LINS_INDEX_SPLIT = "+"
  this.LINS_INDEXS_SPLIT = "|"
  this.init().then(_ => {
    this.events.emit("ready", _)
  })
}


// Synchronization profile.
// save the file list.
// @private
Core.prototype.syncCore = async function () {
  let chunk = []
  for (let value of this.chunk.CHUNKS) {
    
    // traverse all files.
    // Get the file size.
    // Push into the slice group.
    let { name, context } = value
    let { size } = await fs.FsStat(context)
    chunk.push({ name, size })
  }
  
  // Write configuration.
  // save data in JSON format.
  let path = this.INDEX_PATH_CONTEXT
  let data = Buffer.from(JSON.stringify({ chunk }, null, 4))
  void await fs.FsWrite(path, data, 0, data.length, 0)
}


// Synchronous index file.
// save index data.
// @private
Core.prototype.syncIndex = async function () {
  let data = Buffer.alloc(0)
  for (let key in this.engine.INDEXS) {
    
    // traverse all indexes.
    // index encoding.
    // added to the buffer.
    let { blocks, count } = this.engine.INDEXS[key]
    let lins = this.linsEncode(key, count, blocks)
    data = Buffer.concat([ data, lins ])
  }
  
  // write index.
  // Write buffer data.
  let path = this.DB_INDEX_PATH_CONTEXT
  void await fs.FsWrite(path, data, 0, data.length, 0)
}


// Index decoding.
// @params {buffer} data
// @private
Core.prototype.indexParse = function (data) {
  let lins = ""
  for (let byte of data.toString()) {
    
    // If no separator is encountered.
    // Add bytes to the buffer.
    // Go directly to the next loop.
    if (byte !== this.LINS_SPLIT) {
      lins += byte 
      continue
    }

    // encountered a separator.
    // handed to the buffer decoder.
    // and clear the buffer.
    // Continue the process.
    let index = this.linsParse(lins)
    this.engine.INDEXS[index.name] = index
    lins = ""
  }
}


// Buffer encoder.
// @params {buffer} data
// @private
Core.prototype.linsEncode = function (name, count, indexs) {
  let head = [ name, count ].join(this.LINS_HEAD_SPLIT)
  let index = indexs.join(this.LINS_INDEX_SPLIT)
  let data = [ head, index ].join(this.LINS_INDEXS_SPLIT)
  return Buffer.from(data + this.LINS_SPLIT)
}


// Buffer decoder.
// @params {buffer} data
// @private
Core.prototype.linsParse = function (data) {
  let [ head, index ] = data.toString().split(this.LINS_INDEXS_SPLIT)
  let [ name, count ] = head.split(this.LINS_HEAD_SPLIT)
  let blocks = index.split(this.LINS_INDEX_SPLIT).map(Number)
  return { name, count: Number(count), blocks }
}


// Check options file.
// @private
Core.prototype.checkOption = async function () {
  let fd = this.INDEX_PATH_CONTEXT
  let state = await fs.FsStat(fd)
  if (state.size === 0) {
    
    // If the core has not been initialized.
    // Initialize the core.
    void await this.chunk.crate()
    void await this.syncCore()
  } else {
    
    // The core has been initialized.
    // read the core configuration.
    let data = await fs.FsReadFile(this.INDEX_PATH)
    let option = JSON.parse(data.toString())
    void await this.chunk.init(option.chunk) 
  }
}


// create.
// @public
Core.prototype.init = async function () {
  this.INDEX_PATH = path.join(this.PATH_NAME, "index.qs")
  this.DB_INDEX_PATH = path.join(this.PATH_NAME, "db.index.qs")
  this.INDEX_PATH_CONTEXT = await fs.OpenFile(this.INDEX_PATH)
  this.DB_INDEX_PATH_CONTEXT = await fs.OpenFile(this.DB_INDEX_PATH)
  void await this.checkOption()
  
  // Read the index file.
  // Initialize the index.
  let index_fd = this.DB_INDEX_PATH_CONTEXT
  let index = await fs.FsReadFile(index_fd)
  void await this.indexParse(index)
}


// Write.
// @params {string} key
// @params {buffer} value
// @public
Core.prototype.insert = async function (key, value) {
  return await this.engine.insert(key, value)
}


// Get.
// @params {string} key
// @public
Core.prototype.get = async function (key) {
  return await this.engine.get(key)
}


// Delete.
// @params {string} key
// @public
Core.prototype.remove = async function (key) {
  return this.engine.remove(key)
}


// Bind events.
// @params {string} event
// @params {function} handle
Core.prototype.on = function (event, handle) {
  this.events.on(event, handle)
}


// Cleanup status.
// Used for shutdown processing.
// @params {string} key
// @public
Core.prototype.drop = async function () {
  void await this.syncCore()
  void await this.syncIndex()
}


// write stream.
// push the read stream.
// data input.
// @params {string} key
// @params {class} stream
// @public
Core.prototype.push = function (key, stream) {
  return new Promise(async function (resolve, reject) {
    stream
      .on("error", reject)
      .on("end", resolve)
      .on("data", data => {
      void await this.engine.insert(key, data)
    })
  })
}


// read stream.
// return the read stream.
// @params {string} key
// @params {class} stream
// @public
Core.prototype.pull = function (key, stream) {
  return new Promise(async function (resolve, reject) {
    void await this.engine.pull(key, (err, data, end) => {
      !err && end ? resolve(stream.end()) : stream.write(data)
      err && reject(err)
    })
  })
}


// export.
module.exports = Core