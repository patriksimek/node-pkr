# node-pkr [![Dependency Status](https://david-dm.org/patriksimek/node-pkr.png)](https://david-dm.org/patriksimek/node-pkr) [![NPM version](https://badge.fury.io/js/pkr.png)](http://badge.fury.io/js/pkr)

An easy-to-use binary packager and compressor.

## Installation

    npm install pkr

## Quick Example

```javascript
var fs = require('fs');
var Pkr = require('pkr'); 

// Pack folder:
var pkr = new Pkr();
pkr.ignore('node_modules');
pkr.add('.'); // You can add folder or a single file
var buffer = pkr.packSync();

// Manually add a file:
pkr.files.push({
    path: 'greeting.txt',
    filename: '/tmp/greeting.txt' // Path on a local file system
});

// Manually add a buffer:
pkr.files.push({
    path: 'data/greeting.txt',
    data: Buffer.from('hello world')
});

// Archived Files:
console.log(pkr.files);

// Save archive:
fs.writeFileSync('./archive.pkr', buffer);

// Unpack to folder:
Pkr.unpackToSync(buffer, '.');

// Unpack to memory:
var files = Pkr.unpackSync(buffer);
console.log(files);
```

Pkr automatically reads `.pkrignore` file. You can change default name with `pkr.prefix = 'xxx'` to `.xxxignore`.

## License

Copyright (c) 2014-2018 Patrik Simek

The MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
