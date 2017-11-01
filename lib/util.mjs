import fs from 'fs';
import util from 'util';
import glob from 'glob';

const readFileAsync = util.promisify(fs.readFile);

const globAsync = util.promisify(glob);

export { readFileAsync, globAsync };