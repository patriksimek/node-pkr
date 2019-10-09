'use strict'

const Pkr = require('..');
const fs = require('fs');
const pa = require('path');

// remove fist two items
process.argv.shift();
process.argv.shift();

if (process.argv.length) {
	let verbose;
	const folder = pa.resolve(process.argv.pop());
	const name = pa.basename(folder);
	
	if (process.argv[0] === '-v') {
		verbose = true;
	}
	
	if (fs.existsSync(folder) && fs.statSync(folder).isDirectory()) {
		const pkr = new Pkr;
		pkr.verbose = verbose;
		pkr.prefix = 'imt';
		pkr.add(folder);
		
		fs.writeFileSync(`${process.cwd()}/${name}.pkr`, pkr.packSync());
	
	} else {
		console.error("Folder doesn't exist.");
	}

} else {
	console.error("No folder specified.");
}