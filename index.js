var merge = require('merge-util')
var path = require("path")
var fs = require("fs")
var glob = require("glob-stream")
var fse = require('fs-extra')
var exec = require("child_process").exec

var deepMergeFile = function(templatesRoot, root, startHook, doneHook) {
  return function(file) {
    if(startHook) startHook(file)
    var sourcePath = file.path
    var destPath = path.join(root, sourcePath.replace(templatesRoot, ""))
    if(path.extname(sourcePath) == ".json") {
      fs.readFile(sourcePath, function(err, sourceData){
        if(err) return console.error("failed to read template: ", sourcePath, err)
        sourceData = JSON.parse(sourceData.toString())
        fs.readFile(destPath, function(err, destData){
          if(destData)
            destData = JSON.parse(destData.toString())
          else
            destData = {}
          if(typeof sourceData != "object")
            destData = sourceData
          else
            merge(destData, sourceData)
          fse.ensureFile(destPath, function(err){
            if(err) return console.error("failed to ensure file", destPath, err)
            fs.writeFile(destPath, JSON.stringify(destData, null, 2), function(err){
              if(err) 
                console.error("failed to write: ", destPath, err)
              else
                console.log("wrote: ", destPath)
              if(doneHook) doneHook(file)
            })
          })
        })
      })
    } else 
    if(sourcePath.indexOf(".gitignore") > -1) {
      fs.readFile(sourcePath, function(err, sourceData){
        if(err) return console.error("failed to read: ", sourcePath)
        fse.ensureFile(destPath, function(err){
          if(err) return console.error("failed to ensure file", destPath, err)
          fs.readFile(destPath, function(err, destData){
            var sourceLines = sourceData.toString().split("\n")
            var destLines = destData.toString().split("\n")
            sourceLines.forEach(function(line){
              if(destLines.indexOf(line) == -1)
                destLines.push(line)
            })
            fs.writeFile(destPath, destLines.join("\n"), function(err){
              if(err) 
                console.error("failed to append: ", sourcePath, "->", destPath, err)
              else
                console.log("wrote: ", destPath)  
              if(doneHook) doneHook(file)
            })
          })
        })
      })
    } else {
      fs.readFile(sourcePath, function(err, data){
        if(err) return console.error("failed to read: ", sourcePath)
        fse.ensureFile(destPath, function(err){
          if(err) return console.error("failed to ensure file", destPath, err)
          fs.writeFile(destPath, data, function(err){
            if(err) 
              console.error("failed to copy over: ", sourcePath, "->", destPath, err)
            else
              console.log("wrote: ", destPath)  
            if(doneHook) doneHook(file)
          })
        })
      })
    }
  }
}

module.exports = function(angel){
  angel.on("stack add :source", function(angel){
    var templatesRoot = path.join(process.cwd(), angel.cmdData.source)
    var root = process.cwd()
    var filesToProcess = 0
    var onFileStart = function(){
      filesToProcess += 1
    }
    var onFileDone = function(){
      filesToProcess -= 1
      if(filesToProcess == 0) {
        var child = exec("npm install")
        child.on("error", console.error)
        child.stdout.pipe(process.stdout)
        child.stderr.pipe(process.stderr)
      }
    }
    glob.create(templatesRoot+"/**/*.*", {dot: true})
      .on("data", deepMergeFile(templatesRoot, root, onFileStart, onFileDone))
      .on("error", console.error)
  })
  .example("$ angel stack add relative/to/cwd/source/path")
  .description("merges .json files and copyover all others found from source path to current working directory")
}