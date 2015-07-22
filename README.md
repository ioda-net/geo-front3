geo-front3
==========

# Getting started

Checkout the source code:

    $ git clone https://github.com/ioda-net/mf-geoadmin3.git


The build process relies on gulp and closure. Before building the project, you
must run `npm install` in the root folder of the project in order to download
all the dependencies.

You must use `gulp dev --portal <portalname>` to build the given portal for
development. The output will be produced in `dev/portalname`. If portalname is
not precised, it will default to geojb.

You must use `gulp prod --portal <portalname>` to build the specified portal for
production. The output will be produced in `prod/protalname`.
