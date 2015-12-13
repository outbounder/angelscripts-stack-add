# angelscripts-stack-upgrade

Angel script to copy files from source directory to cwd with deep merging of json files

## usage

1. install script to existing project

    $ npm install angelscripts-stack-upgrade

2. create `stacks/myStackChanges`

    - package.json
    + dna
    |- file.json
    + folder
    |+ subfolder
     |- file.js

3. execute the script via `organic-angel`

    $ angel stack add stacks/myStackChanges

### What happens

* all json file contents are deep merged into current working directory. Files not already present in cwd will be created.
* all other files are copied w/ override to current working directory
* `npm install` is started once all copies are finished.

## example

* [organic-stem-skeleton](https://github.com/outbounder/organic-stem-skeleton) look at `/upgrades` folder
