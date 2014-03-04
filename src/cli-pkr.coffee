Pkr = require '..'
fs = require 'fs'
pa = require 'path'

# remove fist two items
process.argv.shift()
process.argv.shift()

if process.argv.length
	folder = pa.resolve process.argv.pop()
	name = pa.basename folder
	
	if process.argv[0] is '-v'
		verbose = true
	
	if fs.existsSync(folder) and fs.statSync(folder).isDirectory()
		pkr = new Pkr
		pkr.verbose = verbose
		pkr.prefix = 'imt'
		pkr.add folder
		
		fs.writeFileSync "#{process.cwd()}/#{name}.pkr", pkr.packSync()
	
	else
		console.error "Folder doesn't exist."

else
	console.error "No folder specified."