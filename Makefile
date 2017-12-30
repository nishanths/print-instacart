.PHONY: js bookmarklet install-deps clean

bookmarklet: js
	@printf "javascript:(function(){"
	@cat fix.min.js
	@printf "})();\n"

js: clean
	@tsc --outFile fix.js
	@uglifyjs -o fix.min.js fix.js
	@rm fix.js

clean:
	@rm -rf fix.min.js

install-deps:
	@npm install -g uglify-es@3.3.3 # the binary name is 'uglifyjs'
