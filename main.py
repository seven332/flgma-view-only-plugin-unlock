from urllib.request import urlopen
from urllib.parse import urlparse
import sys
import os

# https://www.figma.com/figbuild/symlinks/figma_app.eaeb5082ae0be16c2214e674ab53c65d.min.js

url = sys.argv[1]
response = urlopen(url)
text = response.read().decode('utf-8')
text = text.replace('return n.push(...M(e,i))', 'return n.push(...M(e,false))')
filename = os.path.basename(urlparse(url).path)
text_file = open(filename, 'w')
text_file.write(text)
text_file.close()
