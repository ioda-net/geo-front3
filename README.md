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



# Launch test

## Unit tests

You can use `gulp test` to launch the unit tests. To launch tests automatically when a file is
modify, you can use `karma start test/karma-conf.dev.js` (you may need to adapt the path to the
karma executable).

## Integration tests

### setup integration tests

1. You must install protractor in order for the integration tests to work with
   `npm install -g protractor`.
2. You must then install the webdriver with `webdriver-manager update`
3. Copy the `config/test.dist.toml` into `config/test.toml` and update it to your needs.

### Launching integration tests

1. Start webdriver: `webdriver-manager start`
2. Launch the test with `gulp testintegration`



# Update from map.geo.admin.ch

1. Go the the `master` branch and update it with the code of swisstopo.
   Typically this is done by:
   1. `git checkout master`
   2. `git fetch upstream master`
   3. `git rebase upstream/master`
2. Go to the branch `sigeom`: `git checkout sigeom`
3. Merge `master` into `sigeom`: `git merge master`
4. Slove the merge conflicts (See below for some tips)
5. Update Open Layers (See below for the how to and why you must do this update)
5. Commit the result
6. Push the result. **If the push fails because you have unpulled changes, do
   not try a rebase**: a rebase will cancel your merge commit (and will loose
   your merge work, unless you do a `git rebase --abort`) and you will have to
   handle conflict for each commit from swisstopo you are merging into the
   current branch. So if that happens, do:
   1. `git fetch origin sigeom` to get the changes
   2. `git merge origin/sigeom` to merge them with a merge commit into your
      branch


## Some tips to resolve merge conflicts

### Components removed

You can safely remove any files related to these components.

- tooltip
- query


### Components rewritten

You can safely checkout any files that belong to these components

- print
- wmsimport (rewritten into owsimport)


### New components

Normally, they should be in the merge conflicts:

- features
- importows
- webdav


## How to update Open Layer

So we need to build our own version of ol.js. In order to do this, we have a
scrip called `update-open-layers.sh`. Before commiting the merge result, please
launch it (you must be in the root folder of geo-front3):
`./scripts/update-open-layers.sh`. The script will do everything for you.
