'use strict'

const fs = require('fs');
const zlib = require('zlib');
const mkdirp = require('mkdirp');
const debug = require('debug')('pkr');

const osSlash = process.platform === 'win32' ? "\\" : "/";

const createRegexp = function(path) {
	if ((/[\\\/]/).test(path)) {
		path = require('path').resolve(path);
		return new RegExp(`^${path.trim().replace(/([\\\/\.])/g, '\\$1').replace(/\*/g, '([^\\/\\\\]*)')}(.*)$`);
	} else {
		return new RegExp(`${path.trim().replace(/([\\\/\.])/g, '\\$1').replace(/\*/g, '([^\\/\\\\]*)')}`);
	}
};

const readIgnore = function(path, pkr) {
	pkr.ignores.push(createRegexp(`${path}${osSlash}.${pkr.prefix}ignore`));
	fs.readFileSync(`${path}${osSlash}.${pkr.prefix}ignore`, 'utf8').split('\n').filter(line => line.length > 0).map(line =>
		pkr.ignores.push(createRegexp(require('path').normalize(`${path}${osSlash}${line.replace(/^[\/\\]/, '')}`))));
};

class Pkr {
	constructor() {
		this.prefix = 'pkr'
		this.mode = '775'
		this.files = [];
		this.ignores = [];
		this.version = 2;
	}
	
	add(path, relative) {
		path = require('path').resolve(path);

		if (this.ignores.some(ignore => ignore.exec(path))) {
			return this;
		}
		
		if (fs.statSync(path).isDirectory()) {
			if (fs.existsSync(`${path}${osSlash}.${this.prefix}ignore`)) {
				readIgnore(path, this);
			}

			for (let item of fs.readdirSync(path)) {
				this.add(`${path}${osSlash}${item}`, relative ? relative : path);
			}
		} else {
			const f = {
				filename: path,
				path: (relative ? require('path').relative(relative, path) : require('path').basename(path)).replace(/\\/g, '/')
			};
			
			this.files.push(f);
			debug('add file:', f.path);
		}

		return this;
	}

	ignore(path) {
		if (path instanceof RegExp) {
			this.ignores.push(path);
		} else {
			this.ignores.push(createRegexp(path));
		}
	}
	
	packSync() {
		const files = this.files.map(file => ({path: file.path, filename: file.filename, data: file.data}));
		let offset = 0;
		
		for (let file of files) {
			if (!file.data) file.data = fs.readFileSync(file.filename);
			file.offset = offset;
			
			offset += file.data.length;
		}
		
		const dataLength = offset;
		const header = JSON.stringify(files.map(file => ({path: file.path, offset: file.offset, length: file.data.length})));
		const headerLength = Buffer.byteLength(header, 'utf8');
		let body = new Buffer(4 + headerLength + dataLength);

		body.writeUInt32LE(headerLength, 0);
		body.write(header, 4, headerLength, 'utf8');
		
		for (let file of files) {
			file.data.copy(body, 4 + headerLength + file.offset);
			
			// clean
			delete file.data;
			delete file.offset;
		}

		if (this.version === 2) {
			body = zlib.gzipSync(body);
		}

		// --- HEADER ---
		// 0-3  fixed
		// 4    version
		// 5-8  32b header length
		
		const buffer = new Buffer(4 + body.length);
		buffer.writeUInt8(0x70, 0);
		buffer.writeUInt8(0x6b, 1);
		buffer.writeUInt8(0x72, 2);
		buffer.writeUInt8(this.version, 3);
		body.copy(buffer, 4);
		
		return buffer;
	}
	
	static unpackSync(buffer) {
		if (buffer.readUInt8(0) !== 0x70 || buffer.readUInt8(1) !== 0x6b || buffer.readUInt8(2) !== 0x72) {
			throw new Error("Not a valid pkr format.");
		}
		
		const version = buffer.readUInt8(3);

		if (version != 1 && version != 2) {
			throw new Error("Unsupported version.");
		}

		let body = buffer.slice(4);

		if (version === 2) {
			body = zlib.gunzipSync(body);
		}

		const headerLength = body.readUInt32LE(0);
		
		try {
			var header = JSON.parse(body.toString('utf8', 4, headerLength + 4));
		} catch (ex) {
			throw new Error("Invalid header.");
		}

		for (let file of header) {
			const offset = 4 + headerLength + file.offset;
			file.data = body.slice(offset, offset + file.length);
			delete file.offset;
			delete file.length;
		}
		
		Object.defineProperty(header, 'find', {
			value(path) {
				if (path instanceof RegExp) {
					return this.filter(file => path.test(file.path));				
				} else {
					path = path.replace(/\\/g, '/'); // normalize slashes to /
					for (let file of this) {
						if (path === file.path) return file;
					}
					
					return null;
				}
			}
		});
		
		Object.defineProperty(header, 'saveToSync', {
			value(root) {
				root = require('path').resolve(root);
		
				// make sure our root folder exists
				mkdirp.sync(root);
				
				for (let file of this) {
					const folder = require('path').normalize(`${root}${osSlash}${require('path').dirname(file.path)}`);
					if (folder !== root) mkdirp.sync(folder, Pkr.mode);
				
					fs.writeFileSync(require('path').normalize(`${root}${osSlash}${file.path}`), file.data, {mode: Pkr.mode});
				}
			}
		});

		return header;
	}
	
	static unpackToSync(buffer, root) {
		root = require('path').resolve(root);

		// make sure our root folder exists
		mkdirp.sync(root);

		for (let file of this.unpackSync(buffer)) {
			const folder = require('path').normalize(`${root}${osSlash}${require('path').dirname(file.path)}`);
			if (folder !== root) mkdirp.sync(folder, Pkr.mode);
		
			fs.writeFileSync(require('path').normalize(`${root}${osSlash}${file.path}`), file.data, {mode: Pkr.mode});
		}

		return this;
	}
}

module.exports = Pkr;
