// QStorage
// Copyright 2019 Mr.Panda <xivistudios@gmail.com>
// MIT License
"use strict"


// Engine
// @class
function Engine (size, chunk) {
  this.DROP_BLOCKS = new Set()
  this.CHUNK_SIZE = size
  this.chunk = chunk
  this.INDEXS = {}
}


// data input.
// @params {buffer} value
// @private
Engine.prototype.write = async function (value) {
  let block_indexs = []
  let block_index = 0
  let blocks = []
  
  // Non-Buffer to Buffer.
  if (!Buffer.isBuffer(value)) {
    value = Buffer.from(value)
  }
  
  // Split data into individual slices.
  // Split by slice size.
  // Insufficient fragment size default 0 padding.
  let block_size = Math.ceil(value.length / this.CHUNK_SIZE)
  for (let i = 0; i < block_size; i ++) {
    let offset = this.CHUNK_SIZE * i
    let bufs = Buffer.alloc(this.CHUNK_SIZE)
    value.copy(bufs, 0, offset, offset + this.CHUNK_SIZE)
    blocks.push(bufs)
  }
  
  // Check if there are invalid fragments.
  // If there is implementation fragmentation.
  // Write failed fragment first.
  // traversing the failed fragmentation iterator.
  for (let offset of this.DROP_BLOCKS) {
    let block = blocks[block_index]

    // Check if the assignment has ended.
    // If the failed fragment is larger than the written fragment.
    // jump out of the loop.
    if (!block) {
      break 
    }
    
    // write by byte.
    // If the end has been written.
    // Now empty all unfilled bits to 0.
    void await this.chunk.write(block, offset)
    
    // increase the index.
    // Increase the index offset.
    // Delete the filled invalidation index.
    block_index += 1
    block_indexs.push(offset)
    this.DROP_BLOCKS.delete(offset)
  }
  
  // Processed failure fragmentation.
  // append to the end of the data area.
  let offset = this.chunk.len()
  for (let i = block_index; i < blocks.length; i ++) {
    void await this.chunk.write(blocks[i], offset)
    let block_len = blocks[i].length
    block_indexs.push(offset)
    offset += (i + 1) * block_len
  }
  
  // Cache segmentation information.
  // Cache key pair information.
  return {
    count: value.length,
    blocks: block_indexs
  }
}


// write data.
// @params {string} key
// @params {buffer} value
// @public
Engine.prototype.insert = async function (key, value) {
  if (this.INDEXS[key]) {
    return false
  }
  
  // write directly.
  // don't care about follow-up.
  let result = await this.write(value)
  this.INDEXS[key] = result
}


// push data.
// @params {string} key
// @params {stream} stream
// @public
Engine.prototype.push = function (key, stream) {
  return new Promise((resolve, reject) => {
    let index = this.INDEXS[key]
    let size = this.CHUNK_SIZE
    let end = false
    let bufs = []
  
    // Data does not exist.
    // Assign default value.
    if (!index) {
      index = { 
        blocks: [],
        count: 0
      }
    }
    
    // stream process.
    stream.on("error", reject)
    stream.on("end", _=> {
      
      // end event.
      // stop process.
      end = true
    })
    
    // loop.
    // If the data is not exhausted.
    // always read.
    stream.on("readable", async _ => {
      while (true) {
        
        // Write directly.
        // Keep the follow-up.
        // Increase according to current data.
        if (Buffer.isBuffer(bufs)) {
          let result = await this.write(bufs)
          index.blocks.push(...result.blocks)
          index.count += result.count
        }

        // if there is no readable data.
        // then return null.
        bufs = stream.read(size)

        // End of reading.
        if (end) {
          this.INDEXS[key] = index
          resolve()
        }
        
        // read end.
        // stop loop.
        if (bufs === null) {
          break
        }
      }
    })
  })
}


// pull data.
// @params {string} key
// @params {stream} stream
// @public
Engine.prototype.pull = function (key, stream) {
  return new Promise(async (resolve, reject) => {
    let option = this.INDEXS[key]
    let size = this.CHUNK_SIZE

    // Data does not exist.
    if (!option) {
      return reject(false)
    }
    
    // Bind the error event of the write stream.
    stream.on("error", reject)
    stream.on("finish", resolve)

    // take the shard.
    // Extract data.
    // Read data write to write stream.
    let count = option.count
    for (let offset of option.blocks) {
      let len = count > size ? size : count
      let data = await this.chunk.read(offset, len)
      stream.write(data)
      count -= len
    }
    
    // read completed.
    // end writing.
    stream.end()
  })
}


// retrieve data.
// @params {string} key
// @public
Engine.prototype.get = async function (key) {
  let option = this.INDEXS[key]
  
  // Data does not exist.
  if (!option) {
    return null
  }
  
  // take the shard.
  // Extract data.
  let bufs = Buffer.alloc(0)
  let { count, blocks } = option
  for (let offset of blocks) {
    let data = await this.chunk.read(offset, this.CHUNK_SIZE)
    bufs = Buffer.concat([ bufs, data ])
  }
  
  // Return data.
  return bufs.slice(0, count)
}


// delete data.
// @params {string} key
// @public
Engine.prototype.remove = function (key) {
  let option = this.INDEXS[key]
  
  // Data does not exist.
  if (!option) {
    return false
  }
  
  // delete data
  // mark the fragment as invalid
  let { blocks } = option
  delete this.INDEXS[key]
  blocks.forEach(x => this.DROP_BLOCKS.add(x))
  return true
}


// export.
module.exports = Engine