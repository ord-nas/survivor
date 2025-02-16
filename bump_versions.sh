RANDOM_STR=`tr -dc A-Za-z0-9 </dev/urandom | head -c 32`
sed -i "s/src=\"survivor.js?v=[A-Za-z0-9]*\"/src=\"survivor.js?v=$RANDOM_STR\"/g" `find . -name "*.html"`
sed -i "s/href=\"survivor.css?v=[A-Za-z0-9]*\"/href=\"survivor.css?v=$RANDOM_STR\"/g" `find . -name "*.html"`
