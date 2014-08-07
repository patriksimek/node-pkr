fs = require 'fs'
mkdirp = require 'mkdirp'

osSlash = if process.platform is 'win32' then "\\" else "/"

createRegexp = (path) ->
	if (/[\\\/]/).test path
		path = require('path').resolve path
		new RegExp "^#{path.trim().replace(/([\\\/\.])/g, '\\$1').replace(/\*/g, '([^\\/\\\\]*)')}(.*)$"
	
	else
		new RegExp "#{path.trim().replace(/([\\\/\.])/g, '\\$1').replace(/\*/g, '([^\\/\\\\]*)')}"

readIgnore = (path, pkr) ->
	pkr.ignores.push createRegexp("#{path}#{osSlash}.#{pkr.prefix}ignore")
	for line in fs.readFileSync("#{path}#{osSlash}.#{pkr.prefix}ignore", 'utf8').split('\n') when line.length > 0
		pkr.ignores.push createRegexp(require('path').normalize("#{path}#{osSlash}#{line.replace(/^[\/\\]/, '')}"))

class Pkr
	files: null
	ignores: null
	prefix: 'pkr'
	mode: '755'
	verbose: false
	
	constructor: ->
		@files = []
		@ignores = []
	
	add: (path, relative) ->
		path = require('path').resolve path
		
		for ignore in @ignores
			if ignore.exec path then return @
		
		if fs.statSync(path).isDirectory()
			if fs.existsSync "#{path}#{osSlash}.#{@prefix}ignore"
				readIgnore path, @

			for item in fs.readdirSync path
				@add "#{path}#{osSlash}#{item}", relative ? path
		
		else
			f =
				filename: path
				path: (if relative then require('path').relative(relative, path) else require('path').basename(path)).replace(/\\/g, '/')
			
			@files.push f
			if @verbose then console.log f.path

		@

	ignore: (path) ->
		if path instanceof RegExp
			@ignores.push path
			
		else
			@ignores.push createRegexp path
	
	packSync: ->
		files = ({path: file.path, filename: file.filename, data: file.data} for file in @files)
		offset = 0
		
		for file in files
			file.data ?= fs.readFileSync file.filename
			file.offset = offset
			
			offset += file.data.length
		
		dataLength = offset
		header = JSON.stringify({path: file.path, offset: file.offset, length: file.data.length} for file in files)
		headerLength = Buffer.byteLength header, 'utf8'
		
		# --- HEADER ---
		# 0-3	fixed
		# 4		version
		# 5-8	32b header length
		
		buffer = new Buffer 8 + headerLength + dataLength
		buffer.writeUInt8 0x70, 0
		buffer.writeUInt8 0x6b, 1
		buffer.writeUInt8 0x72, 2
		buffer.writeUInt8 0x1, 3
		buffer.writeUInt32LE headerLength, 4
		
		buffer.write header, 8, headerLength, 'utf8'
		
		offset = 8 + headerLength
		
		for file in files
			file.data.copy buffer, 8 + headerLength + file.offset
			
			# clean
			delete file.data
			delete file.offset
		
		buffer
	
	@unpackSync: (buffer) ->
		unless buffer.readUInt8(0) is 0x70 and buffer.readUInt8(1) is 0x6b and buffer.readUInt8(2) is 0x72 and buffer.readUInt8(3) is 0x1
			throw new Error "Not a valid pkr format."
		
		headerLength = buffer.readUInt32LE 4
		
		try
			header = JSON.parse buffer.toString('utf8', 8, headerLength + 8)
		catch ex
			throw new Error "Invalid header."

		for file in header
			offset = 8 + headerLength + file.offset
			file.data = buffer.slice offset, offset + file.length
			delete file.offset
			delete file.length
		
		Object.defineProperty header, 'find',
			value: (path) ->
				if path instanceof RegExp
					return (file for file in @ when path.test file.path)
					
				else
					path = path.replace(/\\/g, '/') # normalize slashes to /
					for file in @ when path is file.path
						return file
					
					null

		header
	
	@unpackToSync: (buffer, root) ->
		root = require('path').resolve root

		# make sure our root folder exists
		mkdirp.sync root
		
		for file in @unpackSync buffer
			folder = require('path').normalize("#{root}#{osSlash}#{require('path').dirname(file.path)}")
			if folder isnt root then mkdirp.sync folder, @mode
			
			fs.writeFileSync require('path').normalize("#{root}#{osSlash}#{file.path}"), file.data,
				mode: @mode

module.exports = Pkr
