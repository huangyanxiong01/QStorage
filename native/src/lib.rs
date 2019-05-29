use std::collections::HashMap;


// 索引
pub struct Index {
    pub count: u64,
    pub blocks: Vec<u64>
}


// 分片
pub struct Chunk {
    pub chunk_size: u64,
    pub storage: Vec<u8>,
    pub drop_blocks: Vec<u64>,
    pub indexs: HashMap<String, Index>
}


impl Chunk {

    // 创建
    pub fn new (size: u64) -> Self {
        Chunk {
            chunk_size: size,
            storage: Vec::new(),
            drop_blocks: Vec::new(),
            indexs: HashMap::new()
        }
    }

    // 写入
    pub fn insert (&mut self, key: String, value: Vec<u8>) {
        let f_size = value.len() as f64 / self.chunk_size as f64;
        let block_size = f_size.ceil() as u64;
        let mut value_copy = value.clone();
        let mut block_indexs = Vec::new();
        let mut blocks = Vec::new();
        let mut block_index = 0;
        
        // 把数据拆分成单个分片
        // 按分片大小拆分
        // 不足分片大小默认0填充
        let mut i: u64 = 0;
        while i < block_size {
            let mut bufs = Vec::new();
            if self.chunk_size <= value_copy.len() as u64 {
                let (left, right) = value_copy.split_at(self.chunk_size as usize);
                bufs.append(&mut left.to_vec());
                value_copy = right.to_vec();
            } else {
                let count = self.chunk_size as usize - value_copy.len();
                let mut x = Vec::with_capacity(count);
                bufs.append(&mut value_copy);
                bufs.append(&mut x);
            }

            i += 1;
            blocks.push(bufs);
            if value_copy.len() == 0 {
                break;
            }
        }

        // 检查是否有失效分片
        // 如果有失效分片
        // 先写入失效分片
        // 遍历失效分片迭代器
        let mut iterator = blocks.iter();
        for value in self.drop_blocks.clone().iter() {
            let block = iterator.next();

            // 检查是否已经分配结束
            // 如果失效的分片大于写入的分片
            // 跳出循环
            if block == None {
                break;
            }

            // 按byte写入
            // 如果已经写入结束
            // 此时把未填充位全部清空为0
            if let Some(data) = block {
                let mut i: usize = 0;
                while i < self.chunk_size as usize {
                    let data = match data.get(i) {
                        Some(x) => *x,
                        None => 0_u8 
                    };

                    self.storage.insert(i + *value as usize, data);
                    i += 1;
                }

                block_index += 1;
                block_indexs.push(*value);
            }
        }


        // 分配结束
        // 从失效分片堆中清除掉已经分配的分片索引
        if block_indexs.len() > 0 {
            let mut atom_drop = Vec::new();
            for value in &self.drop_blocks {
                if !block_indexs.contains(&value) {
                    atom_drop.push(*value);
                }
            }
            
            // 重写失效分片堆
            self.drop_blocks = atom_drop;
        }

        // 处理完失效分片
        // 追加到数据区尾部
        let mut x = block_index as u64;
        while x < blocks.len() as u64 {
            let offset = self.storage.len() as u64;
            if let Some(block) = iterator.next() {
                let mut data = block.clone(); 
                self.storage.append(&mut data);
                block_indexs.push(offset);
            }
            
            x += 1;
        }

        // 缓存分片信息
        // 缓存键对信息
        self.indexs.insert(key, Index {
            count: value.len() as u64,
            blocks: block_indexs
        });
    }

    // 获取数据
    pub fn get (&mut self, key: String) -> Option<Vec<u8>> {
        let mut black = None;

        // 取出分片
        // 抽出数据
        if let Some(option) = self.indexs.get(&key) {
            let count = option.count;
            let blocks = &option.blocks;
            let mut bufs = Vec::new();
            
            // 遍历索引
            for offset in blocks.iter() {
                let skip = *offset as usize;
                let size = self.chunk_size as usize;
                let end = skip + size;
                if let Some(data) = self.storage.get(skip..end) {
                    let mut value = data.to_vec(); 
                    bufs.append(&mut value);
                }
            }

            let (left, _) = bufs.split_at(count as usize);
            black = Some(left.to_vec());
        }

        black
    }

    // 删除数据
    pub fn remove (&mut self, key: String) -> bool {
        let mut black = false;
        if let Some(option) = self.indexs.get(&key) {
            for value in option.blocks.iter() {
                self.drop_blocks.push(*value);
            }

            self.indexs.remove(&key);
            black = true;
        }

        black
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let mut chunk = Chunk::new(4);
        let value = "this is test";
        let value_b = "this is new test";
        let key = String::from("a");

        chunk.insert(key.clone(), value.as_bytes().to_vec());

        let a = chunk.get(key.clone());

        assert_eq!(a, Some(value.as_bytes().to_vec()));
        assert!(chunk.remove(key.clone()));

        chunk.insert(key.clone(), value_b.as_bytes().to_vec());

        let b = chunk.get(key.clone());
        assert_eq!(b, Some(value_b.as_bytes().to_vec()));
        assert!(chunk.remove(key.clone()));
    }
}
