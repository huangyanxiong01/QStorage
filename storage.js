// QStorage
// Copyright 2019 Mr.Panda <xivistudios@gmail.com>
// MIT License
//
//
// File system based object storage, can also 
// be used as a persistent KV database.
//
// This is a file system based single-threaded 
// object storage system. Currently, there is 
// no multi-threading support, no read-write 
// locks, and no isolation locks.
//
// The data is stored as a shard file in the file 
// system. You can define the size of the shard. 
// The fragment content is divided into blocks. 
// Again, you can customize the block size.
// 
// Equivalent to the file system, the data is 
// divided into multiple blocks. When writing, 
// the block index position is recorded. 
// Deleting data marks only the block as invalid 
// and does not delete the block data. When the 
// next data arrives, it writes the failed block, 
// overwriting the old data. The current version 
// does not implement file defragmentation, so 
// there may be invalid data fragmentation, but 
// it does not affect normal use, but it wastes 
/// storage space.
//
// The system does not implement file information, 
// just ordinary KV storage. Note that if you need 
// to store file information, rely on other 
// implementations to store file information.
//
//
"use strict"

module.exports = require("./core/mod")