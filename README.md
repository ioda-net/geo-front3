mf-geoadmin3
============

next generation map.geo.admin.ch

Jenkins build status: [![Jenkins Build Status](https://jenkins.ci.bgdi.ch/buildStatus/icon?job=geoadmin3)](https://jenkins.dev.bgdi.ch/job/geoadmin3/)

# Getting started

Checkout the source code:

    $ git clone https://github.com/geoadmin/mf-geoadmin3.git

or when you're using ssh key (see https://help.github.com/articles/generating-ssh-keys):

    $ git clone git@github.com:geoadmin/mf-geoadmin3.git

Build:

    $ make all

Use `make help` to know about the possible `make` targets and the currently set variables:

    $ make help

Use `make translate` to import directly translations from the googlespreadshhet. Don't forget to set up first these 2 following environment parameter:
    
    export DRIVE_USER=your_login
    export DRIVE_PWD=your_password

Variables have sensible default values for development. Anyhow, they can be set as make macros or envvars. For example:

    $ make APACHE_BASE_PATH=/elemoine apache 
    $ APACHE_BASE_PATH=/elemoine make 

You can customize the build by creating an `rc` file that you source once. Ex:  

    $ cat rc_elemoine 
    export APACHE_BASE_PATH=/mypath
    export APACHE_BASE_DIRECTORY=/home/elemoine/mf-geoadmin3
    export API_URL=//mf-chsdi.3dev.bgdi.ch
    export DEPLOY_TARGET=dev
    $ source rc_elemoine 
    $ make  

For builds on test (rc_dev), integration (rc_int) and production (rc_prod), you
should source the corresponding `rc` file.

On mf0t, create an Apache configuration file for your environment. Ex:

    $ cat /var/www/vhosts/mf-geoadmin3/conf/00-elemoine.conf
    Include /home/elemoine/mf-geoadmin3/apache/*.conf 

## Dependencies

The GeoAdmin team development servers all contain the necessary dependencies
to develop mf-geoadmin3. Even if developement of the project outside of the
GeoAdmin infrastructure is not fully supported (e.g. you would need to
setup your own web server with correct configurations), you should still
be able to build the project on a different, Linux based infrastructure. For
this to work, you need to make sure to install the following dependencies:

    sudo apt-get install python-software-properties 
    sudo add-apt-repository ppa:chris-lea/node.js 
    sudo apt-get update
    sudo apt-get install make gcc+ git unzip openjdk-6-jre openjdk-6-jdk g++ npm python-virtualenv

### Caveats

You might get an error similar to:
    /usr/bin/env: node: No such file or directory
This can be fixed by running:
    sudo ln -s /usr/bin/nodejs /usr/bin/node 
    #see https://github.com/joyent/node/issues/3911

### Update to the last OpenLayers Version

Use `make ol` to update the `ol.js` and `ol-debug.js` files.

Add the correct version tag

https://github.com/geoadmin/mf-geoadmin3/blob/master/Makefile#20

You can also use an argument to test a new version of ol3, for instance you can do:

    make OL3_VERSION="632205d902f8dcc1f03eb1dd1736d26a1b3ac2a3" ol

Remember to update the API and API doc at the same time to keep coherency.

# Automated tests

## Unit tests

We use Karma to configure our unit tests and PhantomJS to run them in.  They
are defined in `test/specs`. They are run as part of the standard build.

Ideally, each component is fully tested with unit tests.

## Crosser browser end-to-end tests with browserstack.com

To run the e2e browserstack tests, a view things need to be set up in your 
environment. You need to have the BROWSERSTACK_USER and BROWSERSTACK_KEY 
variables set. As they are sesitive, they should not be accessible in public 
(don't add them to github). Recommended way is via a protected file on your 
system (readable only by you):
    
    echo "export BROWSERSTACK_USER=***" >> ~/.browserstack
    echo "export BROWSERSTACK_KEY=***" >> ~/.browserstack
    chmod 600 ~/.browserstack

Then add `source ~/.browserstack` to your `.bashrc` file. The infos can be found
here: https://www.browserstack.com/accounts/automate . Please use the credentials
in our keypass file to log in.

Run it using make:

    make teste2e

This uses the BROWSERSTACK_TARGET environment variable (part of rc_* files) to
determine which URL to test.

Run it manually:

    node test/selenium/tests.js -t https://map.geo.admin.ch

This runs it with the given target URL.

These tests are not part of the normal build. They need to be launched manually.

# Deploying project and branches

## Deploying the project to dev, int and prod

Do the following **inside your working directory**:

`make deploydev SNAPSHOT=true`

This updates the source in /var/www...to the latest master branch from github,
builds it from scratch, runs the tests and creates a snapshot. The snapshot directory
will be shown when the script is done. *Note*: you can omit the `SNAPSHOT=true` parameter if
you don't want to create a snapshot e.g. for intermediate releases on dev main.

A snapshot (e.g. 201407031411) can be deployed to integration with:

`make deployint SNAPSHOT=201407031411`

This will do the corresponding thing for prod:

`make deployprod SNAPSHOT=201407031411`


Note: we should NOT manually adapt code in /var/www/vhosts/mf-geoadmin3 directory

## Deploying a branch

Use `make deploybranch` *in your working directory* to deploy your current 
branch to test (Use `make deploybranchint` to also deploy it to integration).
The code for deployment, however, does not come from your working directory,
but does get cloned (first time) or pulled (if done once) *directly from github*.
So you'll likely use this command *after* you push your branch to github.

Use `make deploybranch GIT_BRANCH=dev_other_branch` to deploy a different 
branch than the one you are currently working on. Make sure that the branch 
specified exists on github.

The first time you use the command will take some time to execute.

The code of the deployed branch is in a specific directory 
`/var/www/vhosts/mf-geoadmin3/private/branch` on both test and integration.
The command adds a branch specific configuration to
`/var/www/vhosts/mf-geoadmin3/conf`. This way, the deployed branch
behaves exactly the same as any user specific deploy.

Sample path:
https://mf-geoadmin3.int.bgdi.ch/dev_bottombar/prod

Please only use integration url for external communication (including here on 
github), even though the exact same structure is also available on our test 
instances.

### Get correct link the API
Per default, the API used in the **main** instance of mf-chsdi3. If you want
to target a specific branch of mf-chsdi3, please adapt the `API_URL` variable
in the `rc_branch.mako` file on **your branch**

# Flushing varnish

You can flush varnish instances manually.

    ./scripts/flushvarnish.sh varnihs_host_ip api_host

Where `varnish_host_ip` is the ip of the varnish server and api_host is the hostname of the url you want to flush. e.g. mf-chsdi3.dev.bgdi.ch for dev and api3.geo.admin.ch for prod.


