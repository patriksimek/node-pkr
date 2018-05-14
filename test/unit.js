'use strict'

const fs = require('fs');
const Pkr = require('../');
const assert = require("assert");
const crypto = require('crypto');

let data = null;

describe('pkr test suite', function() {
	let files = null;
	
	it('pico', function(done) {
		const p = new Pkr;
		p.version = 1;

		data = p.packSync();

		assert.strictEqual(data.toString('hex'), '706b7201020000005b5d');

		// 706b72 - pkr id
		// 01 - version
		// 02000000 - header size
		// 5b5d - header - []
		
		done();
	});
	
	it('packing', function(done) {
		const p = new Pkr;
		p.add(`${__dirname}/in`);
		
		assert.equal(p.files.length, 1);
		assert.equal(p.files[0].path, 'a.png');
		
		data = p.packSync();

		assert.strictEqual(data.length, 170538);
		
		done();
	});
	
	it('unpacking to memory', function(done) {
		files = Pkr.unpackSync(data, `${__dirname}/out`);
		
		assert.equal(files.length, 1);
		assert.equal(files[0].path, 'a.png');

		assert.strictEqual(crypto.createHash('sha1').update(files[0].data).digest('hex'), 'b38e4618a07b1750ada82d2fec71fb55ba1803b7');
		
		done();
	});
	
	it('save from memory to disk', function(done) {
		files.saveToSync(`${__dirname}/out`);
		
		done();
	});
	
	it('v1 support', function(done) {
		const p = new Pkr;
		p.version = 1;
		p.add(`${__dirname}/in`);
		
		data = p.packSync();

		assert.strictEqual(data.length, 171726);

		files = Pkr.unpackSync(data);
		
		assert.equal(files.length, 1);
		assert.equal(files[0].path, 'a.png');
		assert.ok(files[0].data.equals(fs.readFileSync(`${__dirname}/in/a.png`)));
		
		done();
	});
});