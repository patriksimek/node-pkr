'use strict'

const Pkr = require('..');
const fs = require('fs');
const pa = require('path');

// remove fist two items
process.argv.shift();
process.argv.shift();

if (process.argv.length) {
	let file = pa.resolve(process.argv.pop());
	const name = pa.basename(file, pa.extname(file));
	
	if (process.argv[0] === '-l') {
		for (file of Pkr.unpackSync(fs.readFileSync(file))) {
			console.log(file.path);
		}
	} else {
		if (fs.existsSync(file)) {
			try { 
				fs.mkdirSync(`${process.cwd()}/${name}`);
			} catch (ex) {}
			
			Pkr.unpackToSync(fs.readFileSync(file), `${process.cwd()}/${name}`);
		} else {
			console.error("File doesn't exist.");
		}
	}
} else {
	console.error("No file specified.");
}