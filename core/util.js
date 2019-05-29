// QStorage
// Copyright 2019 Mr.Panda <xivistudios@gmail.com>
// MIT License
"use strict"


// Write group.
// @params {number} len
// @params {number} skip
// @params {number} limit
// @public
exports.writeGroup = function (len, skip, limit) {
  let offset = skip >= limit ? skip - limit : skip
  let index = Math.floor(skip / limit)
  let postion = 0
  let group = []
  
  // Consider the classification of the first place.
 // If the first bit appears offset.
 // assign an offset to the first bit.
  if (offset > 0) {
    let lenght = limit - offset
    let end = lenght > len ? len : lenght
    group.push([ index, postion, offset, end ])
    len -= lenght
    index += 1
    postion += lenght
  }
  
  // loop.
  // Continuous allocation.
  // until the assignment is complete.
  let loop = true
  for (; loop === true;) {
    
    // if the remaining number is less than the limit.
    // and the tail is not empty.
    // then think the assignment is complete.
    // all the remaining numbers are assigned to the tail.
    if (len < limit && len > 0) {
      group.push([ index, postion, 0, len ])
    }
    
    // allocation is complete.
    // end the loop.
    if (len < limit) {
      loop = false
      break
    }
    
    // No other situation.
    // by average distribution.
    // total consumption.
    // offset increases.
    group.push([ index, postion, 0, limit ])
    postion += limit
    len -= limit
    index += 1
  }
  
  // return.
  // assigned offset data set.
  return group
}


// Read group.
// @params {number} len
// @params {number} skip
// @params {number} limit
// @public
exports.readGroup = function (limit, offset, len) {
  let index = Math.floor(offset / limit)
  let start = offset >= limit ?  offset % limit : offset
  let group = []
  
  // Consider the first place.
  // If the first bit appears offset.
  // assign an offset to the first bit.
  if (start > 0) {
    let lenght = limit - offset
    let end = lenght > len ? len : lenght
    group.push([ index, start, end ])
    len -= lenght
    index += 1
  }
  
  // loop.
  // Continuous allocation.
  // until the assignment is complete.
  let loop = true
  for (; loop === true;) {
    
    // if the remaining number is less than the limit.
    // and the tail is not empty.
    // then think the assignment is complete.
    // all the remaining numbers are assigned to the tail.
    if (len < limit && len > 0) {
      group.push([ index, 0, len ])
    }
    
    // allocation is complete.
    // end the loop.
    if (len < limit) {
      loop = false
      break
    }
    
    // No other situation.
    // by average distribution.
    // total consumption.
    // offset increases.
    group.push([ index, 0, limit ])
    len -= limit
    index += 1
  }
  
  // return.
  // assigned offset data set.
  return group
}