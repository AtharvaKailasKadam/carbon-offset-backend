import fs from 'fs/promises';

// Read JSON file
export async function read(filename) {
  try {
    const data = await fs.readFile(`./data/${filename}`, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Write JSON file
export async function write(filename, data) {
  await fs.writeFile(`./data/${filename}`, JSON.stringify(data, null, 2));
}

// Add item to JSON array
export async function add(filename, item) {
  const data = await read(filename);
  data.push(item);
  await write(filename, data);
  return item;
}

// Find items by condition
export async function find(filename, condition) {
  const data = await read(filename);
  return data.filter(condition);
}