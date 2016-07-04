var getFilePathName = function(path){
  return path && (res = path.match(/[^\/\\]+.\w$/)) && res[0];
}