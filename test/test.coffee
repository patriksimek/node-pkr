Pkr = require '../'
assert = require "assert"

data = null

describe 'pkr test suite', ->
	it 'packing', (done) ->
		p = new Pkr
		p.add "#{__dirname}/in"
		
		assert.equal p.files.length, 1
		assert.equal p.files[0].path, 'a.png'
		
		data = p.packSync()
		
		done()
	
	it 'unpacking', (done) ->
		files = Pkr.unpackSync data, "#{__dirname}/out"
		
		assert.equal files.length, 1
		assert.equal files[0].path, 'a.png'
		
		done()