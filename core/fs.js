// QStorage
// Copyright 2019 Mr.Panda <xivistudios@gmail.com>
// MIT License
"use strict"


// package.
// @package
const fs = require("fs")
const { promisify } = require('util')
let fsstat = promisify(fs.stat)
let fsmkdir = promisify(fs.mkdir)


// Open a file.
// @parmas {string} pathname
// @params {string} flag
// @private
function FsOpen (pathname, flag) {
  return new Promise(function (resolve, reject) {
    fs.open(pathname, flag, function (err, fd) {
      err ? reject(err) : resolve(fd)
    })
  })
}


// Get file status.
// @parmas {class} fd
// @private
function FsStat (fd) {
  return new Promise(function (resolve, reject) {
    fs.fstat(fd, function (err, stats) {
      err ? reject(err) : resolve(stats)
    })
  })
}


// Close file.
// @parmas {class} fd
// @private
function FsClose (fd) {
  return new Promise(function (resolve, reject) {
    fs.close(fd, function (err) {
      err ? reject(err) : resolve()
    })
  })
}


// Read file.
// @parmas {class} fd
// @params {number} start
// @params {number} end
// @private
function FsRead (fd, start, len) {
  return new Promise(function (resolve, reject) {
    let buf = Buffer.allocUnsafe(len)
    fs.read(fd, buf, 0, len, start, function (err, size, bytes) {
      err ? reject(err) : resolve(bytes)
    })
  })
}


// Read file.
// @parmas {string} pathname
// @private
function FsReadFile (pathname) {
  return new Promise(function (resolve, reject) {
    fs.readFile(pathname, function (err, data) {
      err ? reject(err) : resolve(data)
    })
  })
}


// Write file.
// @parmas {class} fd
// @params {buffer} data
// @params {number} offset
// @params {number} len
// @params {number} position
// @private
function FsWrite (...args) {
  return new Promise(function (resolve, reject) {
    fs.write(...args, function (err, bytes) {
      err ? reject(err) : resolve(bytes)
    })
  })
}


// open a file.
// open in storage mode.
// @parmas {string} pathname
// @public
async function OpenFile (pathname) {
  let fd = await FsOpen(pathname, "a")
  void await FsClose(fd)
  return await FsOpen(pathname, "r+")
}

// check dir exist.
// @parmas {string} pathname
// @public
async function dirExist (pathname) {
  return  await fsstat(pathname).then(() => true).catch(() => false)
}

async function mkdir(pathname){
  void await fsmkdir(pathname, { recursive: true }).catch(() => {
    console.error(`Please check ${pathname} the file permissions`);
  });
}

// export.
module.exports = {
  mkdir,
  dirExist,
  FsStat,
  OpenFile,
  FsRead,
  FsWrite,
  FsReadFile
}