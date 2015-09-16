#!/usr/bin/env bash


if [[ ! -e 'src/TemplateCacheModule.js' ]]; then
    gulp build-template-cache
fi


if [[ ! -e 'test/deps' ]]; then
    tmp=$(mktemp -d)
    cp -r --parent src/js/*.js src/components/**/*.js src/components/*.js src/TemplateCacheModule.js "${tmp}/"

    python node_modules/google-closure-library/closure/bin/build/closurebuilder.py --root="${tmp}" --root=node_modules/google-closure-library --namespace="ga" --namespace="__ga_template_cache__" --output_mode=list |
        tr ' ' '\n' |
        grep -v '\-\-js' |
        sed "s#${tmp}/src/##" |
        awk -v q="'" -v t=',' '{print q $1 q t}' |
        sed 's#node_modules#../node_modules#' |
        grep -v "''," > test/deps

    rm -rf "${tmp}"
    rm -f 'test/karma-conf.dev.js'
    rm -f 'test/karma-conf.prod.js' 
fi


if [[ ! -e 'test/karma-conf.dev.js' ]]; then
    gulp build-karma-conf-from-template
fi


if [[ ! -e 'test/karma-conf.prod.js' ]]; then
    gulp build-karma-conf-from-template --prod
fi
