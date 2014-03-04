Pkr = require '..'
fs = require 'fs'
pa = require 'path'

# remove fist two items
process.argv.shift()
process.argv.shift()

if process.argv.length
	file = pa.resolve process.argv.pop()
	name = pa.basename file, pa.extname file
	
	if process.argv[0] is '-l'
		for file in Pkr.unpackSync fs.readFileSync(file)
			console.log file.path
	
	else
		if fs.existsSync file
			try 
				fs.mkdirSync "#{process.cwd()}/#{name}"
			catch ex
			
			Pkr.unpackToSync fs.readFileSync(file), "#{process.cwd()}/#{name}"
		
		else
			console.error "File doesn't exist."

else
	console.error "No file specified."